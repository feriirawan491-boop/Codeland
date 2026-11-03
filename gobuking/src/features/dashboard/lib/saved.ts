import { partnerSalesOpen } from '@/features/partner/lib/public-inventory';
import { readSavedIds, writeSavedIds } from '@/lib/saved-store';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
import { homeAdapter } from '@/features/home-rental/lib/adapter';
import { venueAdapter } from '@/features/venue/lib/adapter';
import { weddingAdapter } from '@/features/wedding/lib/adapter';
import type { SavedProperty, DashboardScenario } from './types';
import {
  requireDashboardAccount,
  assertSameAccount,
  dashboardDelay,
  readDashboardStore,
  saveDashboardRecord,
} from './store';
const OVERRIDES = 'gobuking:listing-status-demo:v1';
export async function listSaved(
  category = '',
  scenario: DashboardScenario = 'ready',
  signal?: AbortSignal,
) {
  const account = requireDashboardAccount();
  await dashboardDelay(scenario, signal);
  assertSameAccount(account.id);
  if (scenario === 'empty') return [];
  const values = await Promise.all(
    readSavedIds(account.id).map(async (savedId): Promise<SavedProperty> => {
      const [prefix, raw] = savedId.includes(':')
        ? savedId.split(':', 2)
        : ['', savedId];
      const id = raw === 'amara' ? 'amara-ballroom' : raw;
      const hotel =
        !prefix || prefix === 'hotel' ? hotelAdapter.getHotelById(id) : null;
      let result: SavedProperty;
      if (hotel)
        result = {
          id: savedId,
          category: 'hotel',
          name: hotel.name,
          area: hotel.area,
          image: hotel.images[0],
          href: `/hotels/${hotel.slug}?locationId=${hotel.locationId}`,
          active: true,
        };
      else {
        const home =
          !prefix || prefix === 'home' ? homeAdapter.getHomeById(id) : null;
        if (home)
          result = {
            id: savedId,
            category: 'home',
            name: home.name,
            area: home.area,
            image: home.images[0],
            href: `/homes/${home.slug}?locationId=${home.locationId}`,
            active: true,
          };
        else if (prefix === 'mice') {
          const context = venueAdapter.getSpaceById(id);
          result = context
            ? {
                id: savedId,
                category: 'mice',
                name: context.space.name,
                area: context.venue.area,
                image: context.space.images[0],
                href: `/mice/${context.space.slug}?locationId=${context.venue.locationId}&flexible=true`,
                active: context.space.active,
              }
            : {
                id: savedId,
                category: 'mice',
                name: 'Listing tidak tersedia',
                area: '',
                image: 'venue',
                href: '',
                active: false,
              };
        } else {
          try {
            const context = await weddingAdapter.getWeddingVenue(id);
            result = {
              id: savedId,
              category: 'wedding',
              name: context.space.name,
              area: context.venue.area,
              image: context.photos[0].image,
              href: `/wedding/${context.space.slug}?locationId=${context.venue.locationId}&flexible=true`,
              active: context.space.active,
            };
          } catch {
            result = {
              id: savedId,
              category:
                prefix === 'home'
                  ? 'home'
                  : prefix === 'hotel'
                    ? 'hotel'
                    : 'wedding',
              name: 'Listing tidak tersedia',
              area: '',
              image: 'venue',
              href: '',
              active: false,
            };
          }
        }
      }
      const suspended = readDashboardStore<boolean>(OVERRIDES)[savedId];
      return {
        ...result,
        active:
          result.active &&
          !suspended &&
          partnerSalesOpen(result.category, hotel?.id ?? id),
      };
    }),
  );
  assertSameAccount(account.id);
  return values.filter((value) => !category || value.category === category);
}
export function removeSaved(id: string) {
  const account = requireDashboardAccount();
  writeSavedIds(
    readSavedIds(account.id).filter((value) => value !== id),
    account.id,
  );
}
export function suspendSavedDemo(id: string, suspended: boolean) {
  requireDashboardAccount();
  saveDashboardRecord(OVERRIDES, id, suspended);
}
