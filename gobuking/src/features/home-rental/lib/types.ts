import type {
  HotelQuery,
  HotelQuote,
  HotelReview,
  HotelScenario,
} from '@/features/hotel/lib/types';
export type HomeQuery = HotelQuery & { rooms: 1 };
export type HomeAmenity =
  | 'wifi'
  | 'kitchen'
  | 'pool'
  | 'parking'
  | 'air'
  | 'washer'
  | 'workspace'
  | 'garden';
export type HomeType = 'villa' | 'house' | 'apartment';
export type HouseRules = {
  pets: boolean;
  smoking: boolean;
  events: boolean;
  quietHours: string;
  minimumAge: number;
};
export type HomeExtra = {
  id: string;
  label: string;
  amount: number;
  basis: 'stay' | 'night';
};
export type HomeProperty = {
  id: string;
  slug: string;
  name: string;
  locationId: string;
  area: string;
  coordinates: [number, number];
  type: HomeType;
  privacy: 'entire-unit';
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  size: number;
  sleeping: { name: string; description: string }[];
  amenities: HomeAmenity[];
  images: string[];
  description: string;
  host: {
    name: string;
    verification: 'demo-reviewed' | 'not-reviewed';
    response: string;
  };
  rules: HouseRules;
  checkIn: string;
  checkOut: string;
  zone: string;
  minNights: number;
  maxNights: number;
  leadDays: number;
  bufferNights: number;
  nightly: number;
  cleaningFee: number;
  serviceFee: number;
  taxPercent: number;
  deposit: { amount: number; recipient: string; policy: string };
  extras: HomeExtra[];
  freeCancellation: boolean;
  score: number | null;
  reviews: HotelReview[];
  ownerBlocks: { start: string; end: string }[];
  resourceId: string;
  active: boolean;
};
export type HomeFilters = {
  maxTotal: number;
  minBedrooms: number;
  minBeds: number;
  minBathrooms: number;
  type: string;
  amenities: HomeAmenity[];
  pets: boolean;
  minScore: number;
  keyword: string;
  sort: 'recommended' | 'price' | 'rating';
  page: number;
  view: 'list' | 'map';
  scenario: HotelScenario;
};
export type HomeQuote = HotelQuote & {
  productType: 'home';
  cleaningFee: number;
  extras: { id: string; label: string; total: number }[];
};
export type HomeResult = { home: HomeProperty; quote: HomeQuote };
export type HomeDraft = {
  id: string;
  homeId: string;
  query: HomeQuery;
  extraIds: string[];
  quote: HomeQuote;
  scenario: HotelScenario;
};
export type HomeBookingSnapshot = Pick<
  HomeProperty,
  | 'id'
  | 'slug'
  | 'name'
  | 'area'
  | 'type'
  | 'bedrooms'
  | 'beds'
  | 'bathrooms'
  | 'maxGuests'
  | 'images'
  | 'rules'
  | 'checkIn'
  | 'checkOut'
  | 'zone'
  | 'bufferNights'
  | 'minNights'
  | 'deposit'
> & { hostName: string; rulesAccepted: true };
export type CalendarDay = {
  date: string;
  available: boolean;
  reason: 'available' | 'past' | 'lead' | 'owner' | 'buffer' | 'reserved';
};
