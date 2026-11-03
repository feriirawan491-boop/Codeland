import { partnerResourceOpen } from '@/features/partner/lib/public-inventory';
import type { EventQuery, Venue, VenueSpace } from './types';
const KEY = 'gobuking:venue-operational-blocks:v1';
export function eventInterval(query: EventQuery, venue: Pick<Venue, 'offset'>) {
  if (query.flexible) return null;
  const offset = `+${String(venue.offset).padStart(2, '0')}:00`;
  return {
    start: new Date(
      `${query.start}T${query.startTime}:00${offset}`,
    ).toISOString(),
    end: new Date(`${query.end}T${query.endTime}:00${offset}`).toISOString(),
  };
}
export function runtimeSpaceBlocked(resourceId: string) {
  try {
    return (
      typeof window !== 'undefined' &&
      JSON.parse(sessionStorage.getItem(KEY) ?? '{}')[resourceId] === true
    );
  } catch {
    return false;
  }
}
export function setDemoOperationalBlock(resourceId: string, blocked: boolean) {
  const values = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<
    string,
    boolean
  >;
  values[resourceId] = blocked;
  sessionStorage.setItem(KEY, JSON.stringify(values));
  window.dispatchEvent(new Event('gobuking:venue-resource-changed'));
}
export function spaceAvailable(
  space: VenueSpace,
  query: EventQuery,
  venue: Venue,
) {
  if (
    !space.active ||
    runtimeSpaceBlocked(space.resourceId) ||
    !partnerResourceOpen(space.resourceId, '', '')
  )
    return false;
  if (
    !query.flexible &&
    !partnerResourceOpen(
      space.resourceId,
      query.start,
      new Date(Date.parse(query.end + 'T00:00:00Z') + 86400000)
        .toISOString()
        .slice(0, 10),
    )
  )
    return false;
  if (query.flexible) return true;
  const interval = eventInterval(query, venue);
  return !space.blocks.some((block) => {
    const offset = `+${String(venue.offset).padStart(2, '0')}:00`;
    return (
      Date.parse(interval!.start) < Date.parse(`${block.end}${offset}`) &&
      Date.parse(interval!.end) > Date.parse(`${block.start}${offset}`)
    );
  });
}
