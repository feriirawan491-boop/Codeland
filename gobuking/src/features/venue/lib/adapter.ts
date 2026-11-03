import { publicVenues } from '@/features/catalog/lib/runtime';
import { weddingSpace } from './wedding-catalog';
import { findFixtureSpace } from './fixtures';
import { eventSchema } from './query';
import { spaceAvailable } from './resources';
import type {
  EventQuery,
  SpaceResult,
  VenueFilters,
  VenueScenario,
} from './types';
export class VenueError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
    public latestVersion?: number,
  ) {
    super(message);
    this.name = 'VenueError';
  }
}
export async function venueDelay(
  scenario: VenueScenario = 'ready',
  signal?: AbortSignal,
) {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, scenario === 'loading' ? 1300 : 200);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
  const errors: Partial<Record<VenueScenario, [string, string, number?]>> = {
    error: ['SERVICE', 'Layanan venue sedang terganggu. Silakan coba lagi.'],
    timeout: ['TIMEOUT', 'Pencarian venue melewati batas waktu.'],
    rate_limited: [
      '429',
      'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
      3,
    ],
    unauthorized: ['401', 'Silakan masuk untuk membuka inquiry ini.'],
    forbidden: ['403', 'Anda tidak memiliki akses ke inquiry ini.'],
    inactive: ['404', 'Ruang tidak aktif atau tidak ditemukan.'],
  };
  const error = errors[scenario];
  if (error) throw new VenueError(...error);
}
export const venueAdapter = {
  async searchMeetingSpaces(
    query: EventQuery,
    filters: VenueFilters,
    scenario: VenueScenario = 'ready',
    signal?: AbortSignal,
  ): Promise<SpaceResult[]> {
    await venueDelay(scenario, signal);
    const parsed = eventSchema.safeParse(query);
    if (!parsed.success)
      throw new VenueError('VALIDATION', parsed.error.issues[0].message);
    if (scenario === 'empty' || scenario === 'blocked') return [];
    const results: SpaceResult[] = [];
    for (const venue of publicVenues()) {
      if (venue.locationId !== query.locationId) continue;
      for (const space of venue.spaces) {
        if (
          !space.services.includes('mice') ||
          !spaceAvailable(space, query, venue) ||
          (space.capacity[query.layout] ?? 0) < query.participants ||
          (filters.setting && space.setting !== filters.setting) ||
          !filters.facilities.every((f) => space.facilities[f] === true) ||
          (filters.keyword &&
            !`${space.name} ${venue.name}`
              .toLowerCase()
              .includes(filters.keyword.toLowerCase()))
        )
          continue;
        const candidates = space.packages.filter(
          (p) =>
            (!filters.basis || p.basis === filters.basis) &&
            (!filters.maxRate ||
              !filters.basis ||
              filters.basis === 'quote' ||
              (p.amount !== null && p.amount <= filters.maxRate)),
        );
        if (!candidates.length) continue;
        results.push({ venue, space, package: candidates[0] });
      }
    }
    return filters.sort === 'price' &&
      filters.basis &&
      filters.basis !== 'quote'
      ? results.sort(
          (a, b) =>
            (a.package?.amount ?? Infinity) - (b.package?.amount ?? Infinity),
        )
      : results;
  },
  async getMeetingSpace(
    slug: string,
    scenario: VenueScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await venueDelay(scenario, signal);
    const value = findFixtureSpace(slug);
    if (!value || !value.space.active || !value.space.services.includes('mice'))
      throw new VenueError('404', 'Ruang tidak aktif atau tidak ditemukan.');
    return structuredClone(value);
  },
  getSpaceById(id: string, service: 'mice' | 'wedding' = 'mice') {
    if (service === 'wedding') {
      const value = weddingSpace(id);
      return value ? { venue: value.venue, space: value.space } : null;
    }
    const value = findFixtureSpace(id);
    return value ? structuredClone(value) : null;
  },
};
