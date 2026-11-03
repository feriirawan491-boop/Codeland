export type PartnerRole = 'owner' | 'operations' | 'finance';
export type PartnerCategory = 'hotel' | 'home' | 'car' | 'mice' | 'wedding';
export type PartnerSection =
  | 'overview'
  | 'business'
  | 'listings'
  | 'inventory'
  | 'reservations'
  | 'operations'
  | 'inquiries'
  | 'customers'
  | 'reviews'
  | 'finance'
  | 'team'
  | 'support';
export type Capability =
  | 'read'
  | 'business'
  | 'bank'
  | 'listing'
  | 'inventory'
  | 'reservation'
  | 'operation'
  | 'crm'
  | 'customer'
  | 'review'
  | 'finance'
  | 'team'
  | 'audit'
  | 'support'
  | 'closure';
export type PrivateFile = {
  id: string;
  name: string;
  type: string;
  size: number;
};
export type Business = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'draft' | 'under_review' | 'approved' | 'suspended' | 'closing';
  version: number;
  documents: PrivateFile[];
  contract: { version: number; acceptedAt: string | null };
  bank: { name: string; holder: string; last4: string; version: number } | null;
  pendingBank: {
    name: string;
    holder: string;
    last4: string;
    version: number;
    status: 'under_review';
  } | null;
  closureReason: string | null;
};
export type Membership = {
  id: string;
  orgId: string;
  accountId: string | null;
  demoOwnerId: string | null;
  name: string;
  email: string;
  role: PartnerRole;
  listingIds: string[];
  status: 'active' | 'invited' | 'revoked';
  version: number;
};
export type PartnerListing = {
  id: string;
  orgId: string;
  sourceId: string | null;
  category: PartnerCategory;
  name: string;
  address: string;
  description: string;
  capacity: number;
  facilities: string[];
  image: string;
  resourceId: string;
  stock: number;
  price: number;
  buffer: number;
  minStay: number;
  ratePlan: string;
  status: 'draft' | 'under_review' | 'published' | 'paused' | 'archived';
  version: number;
  liveName: string | null;
  zone: string;
  publicPath: string | null;
};
export type CalendarRow = {
  date: string;
  stock: number;
  price: number;
  stopSell: boolean;
  minStay: number;
  buffer: number;
  ratePlan: string;
};
export type CalendarPreview = {
  id: string;
  listingId: string;
  version: string;
  expiresAt: string;
  rows: (CalendarRow & { reserved: number; conflict: string | null })[];
};
export type Activity = {
  id: string;
  orgId: string;
  listingId: string | null;
  actor: string;
  action: string;
  resource: string;
  at: string;
};
export type PartnerTicket = {
  id: string;
  orgId: string;
  listingId: string | null;
  subject: string;
  reference: string;
  status: 'open' | 'waiting_partner' | 'closed';
  context: { resource: string; at: string; label: string }[];
  messages: {
    id: string;
    actor: string;
    body: string;
    at: string;
    files: PrivateFile[];
  }[];
  commands: string[];
};
export type ServiceRecord = {
  bookingId: string;
  orgId: string;
  listingId: string;
  version: number;
  status:
    | 'scheduled'
    | 'checked_in'
    | 'picked_up'
    | 'completed'
    | 'no_show_review'
    | 'no_show_confirmed'
    | 'cancellation_review';
  instruction: string;
  notes: string;
  files: PrivateFile[];
  commands: string[];
};
export type PartnerReservation = {
  commissionBps: number;
  platformSubsidy: number;
  id: string;
  listingId: string;
  category: PartnerCategory;
  name: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  start: string;
  end: string;
  zone: string;
  status: string;
  payment: string;
  total: number;
  refund: number;
  refundAt: string | null;
  createdAt: string;
  version: string;
  source: 'stay' | 'car';
};
export type PartnerContext = {
  accountId: string;
  membership: Membership;
  organization: Business;
  organizations: { id: string; name: string; role: PartnerRole }[];
  memberships: Membership[];
  capabilities: Capability[];
  sessionKey: string;
};
export type PartnerQuoteDraft = {
  inquiryId: string;
  listingId: string;
  version: number;
  baseVersion: number;
  lines: { label: string; amount: number }[];
  tax: number;
  serviceFee: number;
  validUntil: string;
  terms: string;
  files: PrivateFile[];
};
export type PartnerStore = {
  businesses: Business[];
  memberships: Membership[];
  listings: PartnerListing[];
  calendars: Record<string, CalendarRow[]>;
  calendarVersions: Record<string, number>;
  activities: Activity[];
  tickets: PartnerTicket[];
  services: ServiceRecord[];
  customerNotes: Record<string, string>;
  quoteDrafts: Record<string, PartnerQuoteDraft>;
  quoteFiles: Record<string, PrivateFile[]>;
  reviewReports: {
    id: string;
    orgId: string;
    reviewId: string;
    reason: string;
    at: string;
  }[];
  payouts: {
    id: string;
    orgId: string;
    amount: number;
    at: string;
    bankVersion: number;
    bankLast4: string;
    allocations?: { listingId: string; amount: number }[];
  }[];
  commands: Record<
    string,
    { orgId: string; actorId: string; resource: string; at: string }
  >;
};
