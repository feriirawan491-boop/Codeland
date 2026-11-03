import { effectivePlatformPolicy } from '@/features/booking/lib/platform-policy';
import type { CalendarRow, PartnerCategory } from './types';
export type PublicPartnerListing = {
  category: PartnerCategory;
  sourceId: string;
  resourceId: string;
  salesOpen: boolean;
  version: number;
  calendar: CalendarRow[];
};
const KEY = 'gobuking:partner-public-inventory:v1';
export function readPublicPartnerInventory(): PublicPartnerListing[] {
  try {
    return typeof window === 'undefined'
      ? []
      : JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
export function writePublicPartnerInventory(value: PublicPartnerListing[]) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
  for (const name of [
    'gobuking:inventory-changed',
    'gobuking:car-inventory-changed',
    'gobuking:venue-resource-changed',
  ])
    window.dispatchEvent(new Event(name));
}
export function partnerSalesOpen(category: PartnerCategory, id: string) {
  if (!effectivePlatformPolicy().categories[category]) return false;
  const entries = readPublicPartnerInventory().filter(
    (v) => v.category === category && v.sourceId === id,
  );
  return !entries.length || entries.some((v) => v.salesOpen);
}
export function partnerResourceDay(resourceId: string, date: string) {
  return readPublicPartnerInventory()
    .find((v) => v.resourceId === resourceId)
    ?.calendar.find((v) => v.date === date);
}
export function partnerResourceOpen(
  resourceId: string,
  start: string,
  end: string,
) {
  const listing = readPublicPartnerInventory().find(
    (v) => v.resourceId === resourceId,
  );
  return (
    !listing ||
    (listing.salesOpen &&
      !listing.calendar.some(
        (d) => d.date >= start && d.date < end && (d.stopSell || d.stock === 0),
      ))
  );
}
export function partnerRateBase(
  resourceId: string,
  start: string,
  end: string,
  fallback: number,
) {
  let base = 0;
  for (
    let day = Date.parse(start + 'T00:00:00Z');
    day < Date.parse(end + 'T00:00:00Z');
    day += 86400000
  )
    base +=
      partnerResourceDay(resourceId, new Date(day).toISOString().slice(0, 10))
        ?.price ?? fallback;
  return base;
}
export function partnerResourceVersion(resourceId: string) {
  const l = readPublicPartnerInventory().find(
    (v) => v.resourceId === resourceId,
  );
  return l ? `.p${l.version}` : '';
}
