export type HotelAmenity =
  'pool' | 'wifi' | 'parking' | 'spa' | 'restaurant' | 'accessible';
export type HotelScenario =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'sold_out'
  | 'price_changed'
  | 'quote_expired'
  | 'map_error'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'timeout'
  | 'inactive';
export type HotelQuery = {
  locationId: string;
  start: string;
  end: string;
  adults: number;
  children: number;
  childAges: string[];
  rooms: number;
};
export type HotelFilters = {
  maxTotal: number;
  minScore: number;
  stars: number[];
  amenities: HotelAmenity[];
  breakfast: boolean;
  freeCancellation: boolean;
  propertyType: string;
  sort: 'recommended' | 'price' | 'rating';
  page: number;
  view: 'list' | 'map';
  keyword: string;
  scenario: HotelScenario;
};
export type RoomRate = {
  id: string;
  label: string;
  nightly: number;
  breakfast: boolean;
  freeCancellation: boolean;
};
export type HotelRoom = {
  resourceId: string;
  id: string;
  name: string;
  size: number;
  beds: string;
  capacity: number;
  stock: number;
  inventoryByDate?: Record<string, number>;
  image: string;
  rates: RoomRate[];
};
export type HotelReview = {
  id: string;
  author: string;
  score: number;
  date: string;
  title: string;
  body: string;
  trip: string;
};
export type Hotel = {
  id: string;
  slug: string;
  name: string;
  locationId: string;
  area: string;
  address: string;
  distance: number;
  stars: 1 | 2 | 3 | 4 | 5;
  propertyType: 'hotel' | 'resort';
  score: number | null;
  amenities: HotelAmenity[];
  images: string[];
  description: string;
  checkIn: string;
  checkOut: string;
  zone: string;
  mode: 'instant' | 'request';
  taxPercent: number;
  serviceFee: number;
  coordinates: [number, number];
  rooms: HotelRoom[];
  reviews: HotelReview[];
};
export type HotelQuote = {
  promotion?: import('@/features/admin/lib/public-content').PublicPromotion;
  id: string;
  version: string;
  propertyId: string;
  selectionId: string;
  resourceId: string;
  productType?: 'hotel' | 'home';
  cleaningFee?: number;
  extras?: { id: string; label: string; total: number }[];
  rateId: string;
  quantity: number;
  nights: number;
  base: number;
  tax: number;
  serviceFee: number;
  total: number;
  currency: 'IDR';
  freeCancellation: boolean;
  breakfast: boolean;
  expiresAt: string;
  serverTime: string;
};
export type HotelResult = {
  hotel: Hotel;
  quote: HotelQuote;
  room: HotelRoom;
  rate: RoomRate;
};
export type BookingStatus =
  | 'awaiting_payment'
  | 'confirmed'
  | 'expired'
  | 'cancelled'
  | 'exception'
  | 'completed';
export type PaymentStatus =
  'not_started' | 'pending' | 'succeeded' | 'failed' | 'expired';
export type RefundStatus = 'none' | 'requested' | 'processing' | 'succeeded';
export type BookingEvent = { id: string; label: string; at: string };
export type BookingContact = { name: string; email: string; guestName: string };
export type BookingInvoice = {
  number: string;
  issuedAt: string;
  paidAt: string | null;
  recipientEmail: string;
  emailStatus: 'simulated' | 'failed';
  emailAttemptedAt: string;
  emailAttempts: number;
};
export type DemoBooking = {
  platformPolicy?: import('@/features/booking/lib/platform-policy').BookingPlatformPolicy;
  id: string;
  customerId: string;
  paymentMethod: 'va' | 'qris';
  contact?: BookingContact;
  invoice?: BookingInvoice;
  home?: import('@/features/home-rental/lib/types').HomeBookingSnapshot;
  query: HotelQuery;
  quote: HotelQuote;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  refundStatus: RefundStatus;
  refundAmount: number;
  expiresAt: string;
  createdAt: string;
  events: BookingEvent[];
  processedCommands: string[];
  completedAt?: string;
  staySnapshot?: import('@/features/booking/lib/presentation').ReservationPresentation;
  cancellationPolicy?: import('@/features/booking/lib/cancellation').CancellationPolicy;
  cancellation?: import('@/features/booking/lib/cancellation').CancellationSnapshot;
  cancellationClock?: string;
};
export type BookingCommand =
  | 'complete'
  | 'expire'
  | 'start_payment'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'late_payment'
  | 'cancel'
  | 'refund_succeeded'
  | 'resend_invoice'
  | 'invoice_email_failed';
