export type RentalMode = 'driver' | 'self';
export type CarClass = 'city' | 'mpv' | 'suv' | 'van';
export type CarScenario =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'timeout'
  | 'rate_limited'
  | 'inactive'
  | 'maintenance'
  | 'driver_busy'
  | 'price_changed'
  | 'quote_expired'
  | 'mutation_timeout'
  | 'unauthorized'
  | 'forbidden';
export type CarQuery = {
  locationId: string;
  pickupArea: string;
  returnArea: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  mode: RentalMode;
};
export type CarFilters = {
  vehicleClass: '' | CarClass;
  transmission: '' | 'automatic' | 'manual';
  seats: number;
  baggage: number;
  provider: string;
  maxTotal: number;
  keyword: string;
  sort: 'recommended' | 'total';
  page: number;
};
export type CarOffer = {
  id: string;
  locationId: string;
  name: string;
  vehicleClass: CarClass;
  transmission: 'automatic' | 'manual';
  seats: number;
  baggage: number | null;
  providerId: string;
  providerName: string;
  mode: RentalMode;
  image: string;
  unitHours: number;
  rate: number;
  taxPercent: number;
  serviceFee: number;
  deliveryFee: number;
  deposit: number;
  minAge: number;
  leadHours: number;
  uploadRequired: boolean;
  bufferMinutes: number;
  areas: string[];
  fuel: boolean;
  toll: boolean;
  parking: boolean;
  overtime: number;
  protection: string;
  active: boolean;
};
export type CarQuote = {
  promotion?: import('@/features/admin/lib/public-content').PublicPromotion;
  id: string;
  version: string;
  durationHours: number;
  units: number;
  unitHours: number;
  unitRate: number;
  base: number;
  tax: number;
  serviceFee: number;
  deliveryFee: number;
  total: number;
  deposit: number;
  expiresAt: string;
  serverTime: string;
};
export type CarResult = {
  offer: CarOffer;
  quote: CarQuote;
  available: boolean;
  reason: string | null;
  serverTime: string;
};
export type CarDraft = {
  id: string;
  query: CarQuery;
  offer: CarOffer;
  quote: CarQuote;
  scenario: CarScenario;
};
export type CarRenter = {
  name: string;
  age: number;
  license: boolean;
  eligibility: boolean;
  pickupDetail: string;
  notes: string;
  consent: boolean;
};
export type CarAssignment = {
  model: string;
  vehicleClass: CarClass;
  seats: number;
  baggage: number | null;
  transmission: 'automatic' | 'manual';
  plate: string;
  driverName: string | null;
  equivalent: boolean;
};
export type CarBookingStatus =
  | 'requested'
  | 'rejected'
  | 'awaiting_payment'
  | 'confirmed'
  | 'expired'
  | 'in_use'
  | 'completed'
  | 'cancelled'
  | 'exception';
export type CarBooking = {
  refundAmount?: number;
  platformPolicy?: import('@/features/booking/lib/platform-policy').BookingPlatformPolicy;
  id: string;
  customerId: string;
  draftId: string;
  query: CarQuery;
  offer: CarOffer;
  quote: CarQuote;
  renter: CarRenter;
  contact: { name: string; email: string; phone: string };
  document: { name: string; size: number; type: string } | null;
  status: CarBookingStatus;
  payment: 'not_started' | 'pending' | 'succeeded' | 'failed' | 'expired';
  paymentMethod: 'va' | 'qris' | null;
  refund: 'none' | 'processing' | 'succeeded';
  reason: string | null;
  expiresAt: string | null;
  assignment: CarAssignment | null;
  replacement: CarAssignment | null;
  handover: {
    pickup: boolean;
    returned: boolean;
    fuelStart: string | null;
    fuelEnd: string | null;
    odometerStart: number | null;
    odometerEnd: number | null;
    conditionStart: string | null;
    conditionEnd: string | null;
  };
  dispute: boolean;
  invoice: {
    number: string;
    issuedAt: string;
    emailStatus: 'simulated' | 'failed';
    attempts: number;
  } | null;
  events: { id: string; label: string; at: string }[];
  commands: string[];
  createdAt: string;
  serverTime: string;
};
export type CarAction =
  | 'approve'
  | 'reject'
  | 'expire'
  | 'maintenance'
  | 'driver_conflict'
  | 'start_payment'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'late_payment'
  | 'propose_replacement'
  | 'accept_replacement'
  | 'reject_replacement'
  | 'pickup'
  | 'return'
  | 'dispute'
  | 'cancel'
  | 'resend_invoice'
  | 'invoice_email_failed'
  | 'refund_succeeded';
