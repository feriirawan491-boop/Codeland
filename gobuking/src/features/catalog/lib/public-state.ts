import type { PartnerCategory } from '@/features/partner/lib/types';
export type ApprovedListing = {
  listingId: string;
  orgId: string;
  category: PartnerCategory;
  sourceId: string;
  resourceId: string;
  name: string;
  address: string;
  description: string;
  capacity: number;
  image: string;
  stock: number;
  price: number;
  slug: string;
  locationId: string;
  zone: string;
  buffer: number;
  minStay: number;
  version: number;
};
export const PUBLIC_ASSETS = [
  'hero',
  'hotel',
  'villa',
  'room',
  'venue',
  'bali',
  'jakarta',
  'bandung',
  'yogyakarta',
  'lombok',
  'car-city',
  'car-suv',
  'mice-boardroom',
  'mice-conference',
  'mice-meeting',
  'wedding-celebration',
  'wedding-garden',
  'wedding-outdoor',
] as const;
export function approvedCatalog(): ApprovedListing[] {
  try {
    return typeof window === 'undefined'
      ? []
      : JSON.parse(
          sessionStorage.getItem('gobuking:approved-catalog:v1') ?? '[]',
        );
  } catch {
    return [];
  }
}
export function saveApprovedCatalog(v: ApprovedListing[]) {
  sessionStorage.setItem('gobuking:approved-catalog:v1', JSON.stringify(v));
  window.dispatchEvent(new Event('gobuking:catalog-changed'));
}
