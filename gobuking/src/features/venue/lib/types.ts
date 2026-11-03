import type { WeddingRequirements, WeddingPackageTerms } from './wedding-types';
export type VenueService = 'mice' | 'wedding';
export type EventLayout =
  'theater' | 'classroom' | 'boardroom' | 'ushape' | 'banquet' | 'standing';
export type VenueFacility =
  'av' | 'wifi' | 'parking' | 'catering' | 'accessible';
export type PriceBasis = 'participant' | 'hour' | 'day' | 'quote' | 'event';
export type EventQuery = {
  locationId: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  flexible: boolean;
  participants: number;
  layout: EventLayout;
  eventType: 'meeting' | 'conference' | 'workshop' | 'gathering';
};
export type VenuePackage = {
  id: string;
  name: string;
  basis: PriceBasis;
  amount: number | null;
  minParticipants: number;
  durationHours: number;
  includes: string[];
  excludes: string[];
  taxPercent: number;
  servicePercent: number;
  wedding?: WeddingPackageTerms;
};
export type VenueSpace = {
  id: string;
  slug: string;
  venueId: string;
  name: string;
  area: number;
  setting: 'indoor' | 'outdoor';
  capacity: Record<EventLayout, number | null>;
  facilities: Partial<Record<VenueFacility, boolean | null>>;
  images: string[];
  packages: VenuePackage[];
  rules: string[];
  resourceId: string;
  services: VenueService[];
  active: boolean;
  blocks: { start: string; end: string; source: 'operations' | 'wedding' }[];
};
export type Venue = {
  id: string;
  name: string;
  locationId: string;
  area: string;
  zone: string;
  offset: number;
  description: string;
  pic: { name: string; team: string };
  spaces: VenueSpace[];
};
export type VenueFilters = {
  setting: '' | 'indoor' | 'outdoor';
  facilities: VenueFacility[];
  basis: '' | PriceBasis;
  maxRate: number;
  sort: 'recommended' | 'price';
  keyword: string;
  page: number;
};
export type VenueScenario =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'timeout'
  | 'rate_limited'
  | 'unauthorized'
  | 'forbidden'
  | 'inactive'
  | 'blocked'
  | 'mutation_timeout';
export type SpaceResult = {
  venue: Venue;
  space: VenueSpace;
  package: VenuePackage | null;
};
export type InquiryContact = {
  name: string;
  email: string;
  phone: string;
  company: string;
};
export type InquiryNeeds = {
  av: boolean;
  catering: boolean;
  rooms: number;
  budget?: number;
  notes: string;
};
export type AttachmentMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
};
export type InquiryStatus =
  | 'new'
  | 'assigned'
  | 'in_discussion'
  | 'quoted'
  | 'closed_won'
  | 'closed_lost'
  | 'withdrawn';
export type QuoteStatus =
  'sent' | 'accepted' | 'rejected' | 'expired' | 'superseded';
export type VenueQuote = {
  id: string;
  version: number;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
  base: number;
  tax: number;
  serviceFee: number;
  total: number;
  lines: { label: string; amount: number }[];
  event: EventQuery;
  spaceName: string;
  venueName: string;
  packageName: string;
  packageSnapshot?: VenuePackage;
  wedding?: WeddingRequirements;
  terms: string[];
};
export type VenueRequest = {
  id: string;
  status:
    | 'submitted'
    | 'under_review'
    | 'follow_up_required'
    | 'accepted_for_contract'
    | 'rejected'
    | 'withdrawn'
    | 'expired';
  quoteId: string | null;
  quoteVersion: number | null;
  total: number | null;
  packageSnapshot?: VenuePackage;
  wedding?: WeddingRequirements;
  createdAt: string;
  event: EventQuery;
  terms: string[];
};
export type VenueInquiry = {
  id: string;
  service: VenueService;
  commandId: string;
  ownerId: string | null;
  contact: InquiryContact;
  needs: InquiryNeeds;
  event: EventQuery;
  spaceId: string;
  venueId: string;
  packageId: string;
  wedding?: WeddingRequirements;
  spaceName: string;
  venueName: string;
  zone: string;
  verifiedAt: string | null;
  status: InquiryStatus;
  createdAt: string;
  pic: { name: string; team: string } | null;
  responseDueAt: string | null;
  attachments: AttachmentMeta[];
  quotes: VenueQuote[];
  request: VenueRequest | null;
  requests: VenueRequest[];
  history: {
    id: string;
    at: string;
    label: string;
    values?: Record<string, string | number>;
  }[];
  commands: string[];
};
export type InquiryInput = {
  service: VenueService;
  spaceId: string;
  packageId: string;
  wedding?: WeddingRequirements;
  event: EventQuery;
  contact: InquiryContact;
  needs: InquiryNeeds;
  consent: boolean;
};
