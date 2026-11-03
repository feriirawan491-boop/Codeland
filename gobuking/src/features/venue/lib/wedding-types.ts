import type { EventQuery, Venue, VenuePackage, VenueSpace } from './types';
export type WeddingFormat = 'seated' | 'standing';
export type WeddingKind = 'ballroom' | 'garden' | 'resort' | 'hall';
export type WeddingRequirements = {
  alternativeDates: string[];
  siteVisit: boolean;
  siteVisitDate: string;
  ceremony: 'ceremony' | 'reception' | 'both';
  decoration: boolean;
};
export type WeddingPackageTerms = {
  kind: 'venue-only' | 'inclusive';
  catering: boolean | null;
  decoration: boolean | null;
  overtime: number | null;
  overtimePolicy: string;
};
export type WeddingQuery = EventQuery & { layout: 'banquet' | 'standing' };
export type WeddingFilters = {
  setting: '' | 'indoor' | 'outdoor';
  kind: '' | WeddingKind;
  packageKind: '' | 'venue-only' | 'inclusive';
  budget: number;
  sort: 'recommended' | 'total';
  keyword: string;
  page: number;
};
export type WeddingSpace = {
  venue: Venue;
  space: VenueSpace;
  kind: WeddingKind;
  seated: number | null;
  standing: number | null;
  openTime: string;
  closeTime: string;
  musicUntil: string;
  access: string;
  parking: string;
  photos: { image: string; area: string }[];
};
export type WeddingResult = WeddingSpace & {
  package: VenuePackage;
  estimate: number | null;
};
