export type FlightQuery = {
  locationId: string;
  destinationId: string;
  start: string;
  end?: string;
  trip: 'oneway' | 'roundtrip';
  adults: number;
  children: number;
  infants: number;
  cabin: 'economy' | 'business';
};
export type Airport = {
  id: string;
  name: string;
  city: string;
  zone: string;
  zoneLabel: string;
  offset: number;
};
export type FlightSegment = {
  id: string;
  airlineId: string;
  airline: string;
  number: string;
  origin: Airport;
  destination: Airport;
  departureAt: string;
  arrivalAt: string;
  cabin: FlightQuery['cabin'];
  checkedBaggage: string | null;
  cabinBaggage: string | null;
};
export type FlightLeg = { id: string; segments: FlightSegment[] };
export type FlightOffer = {
  id: string;
  supplierOfferId: string;
  source: string;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  total: number;
  currency: 'IDR';
  price: {
    adultTotal: number;
    childTotal: number;
    infantTotal: number;
    taxesAndFees: number;
  };
  fetchedAt: string;
  expiresAt: string | null;
  fareConditions: string[];
};
export type FlightEnvelope = {
  data: FlightOffer[];
  requestId: string;
  fetchedAt: string;
  serverTime: string;
  source: string;
  mode: 'demo';
};
export type FlightScenario =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'timeout'
  | 'rate_limited'
  | 'offline'
  | 'unavailable'
  | 'expired'
  | 'no_expiry'
  | 'error'
  | 'unauthorized'
  | 'forbidden'
  | 'inactive';
export type FlightFilters = {
  airlines: string[];
  stops: 'all' | 'direct' | 'one';
  departure: 'all' | 'morning' | 'afternoon' | 'evening';
  sort: 'recommended' | 'price' | 'duration';
  page: number;
};
export interface FlightProvider {
  search(
    query: FlightQuery,
    scenario: FlightScenario,
    signal?: AbortSignal,
  ): Promise<FlightEnvelope>;
}
