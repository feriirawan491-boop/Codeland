import type { DemoBooking } from '@/features/hotel/lib/types';
import type { CarBooking } from '@/features/car/lib/types';
import type { ReservationPresentation } from '@/features/booking/lib/presentation';
export type DashboardSection =
  | 'bookings'
  | 'history'
  | 'inquiries'
  | 'saved'
  | 'profile'
  | 'refunds'
  | 'reviews'
  | 'security'
  | 'support';
export type DashboardScenario =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'timeout'
  | 'rate_limited'
  | 'unauthorized'
  | 'forbidden'
  | 'mutation_timeout';
export type BookingCategory = 'hotel' | 'home' | 'car';
export type DashboardBooking = {
  id: string;
  category: BookingCategory;
  title: string;
  subtitle: string;
  image: string;
  status: string;
  payment: string;
  refundStatus: string;
  refundAmount: number;
  total: number;
  createdAt: string;
  start: string;
  end: string;
  zone: string;
  completedAt: string | null;
  canInvoice: boolean;
  canPay: boolean;
  canCancel: boolean;
  history: boolean;
  href: string;
};
export type MyBooking =
  | { kind: 'stay'; value: DemoBooking; presentation: ReservationPresentation }
  | { kind: 'car'; value: CarBooking };
export type ListFilters = {
  category: string;
  status: string;
  dateKind: 'service' | 'created';
  from: string;
  to: string;
  keyword: string;
  page: number;
};
export type SavedProperty = {
  id: string;
  category: 'hotel' | 'home' | 'mice' | 'wedding';
  name: string;
  area: string;
  image: string;
  href: string;
  active: boolean;
};
export type ProfilePreferences = {
  language: 'id' | 'en';
  currency: 'IDR';
  emailUpdates: boolean;
};
export type ContactChallenge = {
  id: string;
  accountId: string;
  sessionId: string | null;
  field: 'email' | 'phone';
  value: string;
  previous: string;
  expiresAt: string;
  verifiedAt: string | null;
};
export type AccountReview = {
  id: string;
  accountId: string;
  bookingId: string;
  score: number;
  title: string;
  body: string;
  subscore: number | null;
  status: 'pending' | 'published' | 'rejected';
  reply: string | null;
  reason: string | null;
  createdAt: string;
  commandId: string;
};
export type ReviewEligibility = {
  booking: DashboardBooking;
  eligible: boolean;
  reason: string | null;
  expiresAt: string | null;
};
export type TicketCategory =
  | 'general'
  | 'booking'
  | 'inquiry'
  | 'privacy_access'
  | 'privacy_correction'
  | 'privacy_delete';
export type TicketFile = {
  id: string;
  name: string;
  type: string;
  size: number;
};
export type SupportTicket = {
  id: string;
  accountId: string;
  subject: string;
  category: TicketCategory;
  referenceId: string | null;
  status: 'open' | 'waiting_customer' | 'closed' | 'verification_required';
  messages: {
    id: string;
    actor: 'customer' | 'support' | 'system';
    body: string;
    at: string;
    files: TicketFile[];
  }[];
  createdAt: string;
  updatedAt: string;
  commands: string[];
};
