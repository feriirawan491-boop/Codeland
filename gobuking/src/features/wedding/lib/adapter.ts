import { venueDelay, VenueError } from '@/features/venue/lib/adapter';
import {
  weddingCatalog,
  weddingSpace,
} from '@/features/venue/lib/wedding-catalog';
import { spaceAvailable } from '@/features/venue/lib/resources';
import { packageEstimate } from '@/features/venue/lib/pricing';
import type { VenueScenario } from '@/features/venue/lib/types';
import type {
  WeddingFilters,
  WeddingQuery,
  WeddingResult,
} from '@/features/venue/lib/wedding-types';
import { weddingQuerySchema } from './query';
export const weddingAdapter = {
  async searchWeddingVenues(
    query: WeddingQuery,
    filters: WeddingFilters,
    scenario: VenueScenario = 'ready',
    signal?: AbortSignal,
  ): Promise<WeddingResult[]> {
    const valid = weddingQuerySchema.safeParse(query);
    if (!valid.success)
      throw new VenueError('VALIDATION', valid.error.issues[0].message);
    await venueDelay(scenario, signal);
    if (scenario === 'empty' || scenario === 'blocked') return [];
    const results: WeddingResult[] = [];
    for (const context of weddingCatalog()) {
      const { space, venue } = context;
      if (
        !space.active ||
        venue.locationId !== query.locationId ||
        !spaceAvailable(space, query, venue) ||
        (space.capacity[query.layout] ?? 0) < query.participants ||
        (filters.setting && space.setting !== filters.setting) ||
        (filters.kind && context.kind !== filters.kind) ||
        (filters.keyword &&
          !`${space.name} ${venue.name}`
            .toLowerCase()
            .includes(filters.keyword.toLowerCase()))
      )
        continue;
      const packs = space.packages.filter(
        (pack) =>
          !filters.packageKind || pack.wedding?.kind === filters.packageKind,
      );
      const proposals = packs
        .map((pack) => ({
          pack,
          estimate: packageEstimate(pack, query)?.total ?? null,
        }))
        .filter(
          (value) =>
            !filters.budget ||
            (value.estimate !== null && value.estimate <= filters.budget),
        )
        .sort((a, b) => (a.estimate ?? Infinity) - (b.estimate ?? Infinity));
      const chosen = proposals[0];
      if (chosen)
        results.push({
          ...context,
          package: chosen.pack,
          estimate: chosen.estimate,
        });
    }
    return filters.sort === 'total'
      ? results.sort(
          (a, b) => (a.estimate ?? Infinity) - (b.estimate ?? Infinity),
        )
      : results;
  },
  async getWeddingVenue(
    id: string,
    scenario: VenueScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await venueDelay(scenario, signal);
    const context = weddingSpace(id);
    if (!context || !context.space.active)
      throw new VenueError(
        '404',
        'Venue pernikahan tidak aktif atau tidak ditemukan.',
      );
    return {
      ...context,
      areas: weddingCatalog()
        .filter((value) => value.venue.id === context.venue.id)
        .map((value) => ({ slug: value.space.slug, name: value.space.name })),
    };
  },
  async getWeddingPackages(id: string) {
    const context = await this.getWeddingVenue(id);
    return context.space.packages;
  },
};
