import type {
  PrivateFile,
  PartnerCategory,
} from '@/features/partner/lib/types';
export type AdminRole =
  | 'super_admin'
  | 'partnership'
  | 'operations'
  | 'finance_maker'
  | 'finance_checker';
export type AdminCapability =
  | 'read'
  | 'verify'
  | 'catalog'
  | 'reservation'
  | 'crm'
  | 'customer'
  | 'refund_request'
  | 'refund_approve'
  | 'reconcile'
  | 'payout_make'
  | 'payout_approve'
  | 'payout_record'
  | 'support'
  | 'cms'
  | 'reports'
  | 'settings'
  | 'moderation'
  | 'integration'
  | 'replay'
  | 'audit'
  | 'access';
export type AdminSection =
  | 'overview'
  | 'partners'
  | 'catalog'
  | 'reservations'
  | 'venue-crm'
  | 'customers'
  | 'payments'
  | 'settlements'
  | 'support'
  | 'cms'
  | 'reports'
  | 'settings'
  | 'moderation'
  | 'integrations'
  | 'access';
export type AdminActor = {
  id: string;
  accountId: string | null;
  demoOwnerId: string | null;
  email: string;
  name: string;
  role: AdminRole;
  orgIds: string[] | 'all';
  active: boolean;
  version: number;
};
export type AdminContext = {
  accountId: string;
  actor: AdminActor;
  actors: AdminActor[];
  principal: string;
  capabilities: AdminCapability[];
  key: string;
};
export type AdminBooking = {
  id: string;
  source: 'stay' | 'car';
  category: 'hotel' | 'home' | 'car';
  orgId: string | null;
  listingId: string | null;
  customerId: string;
  name: string;
  customerName: string;
  email: string;
  status: string;
  payment: string;
  refundStatus: string;
  total: number;
  paid: number;
  refund: number;
  commissionBps: number;
  platformSubsidy: number;
  createdAt: string;
  start: string;
  end: string;
  zone: string;
  version: string;
  timeline: { id: string; at: string; label: string }[];
};
export type AdminAudit = {
  id: string;
  actorId: string;
  actor: string;
  role: AdminRole;
  action: string;
  resource: string;
  orgId: string | null;
  reason: string;
  at: string;
  correlationId: string;
};
export type Verification = {
  orgId: string;
  version: number;
  pic: boolean;
  documents: boolean;
  bank: boolean;
  contract: boolean;
  evidence: PrivateFile[];
  decisions: {
    id: string;
    actor: string;
    action: 'approve' | 'revision' | 'reject' | 'suspend' | 'bank';
    reason: string;
    at: string;
    businessVersion: number;
  }[];
};
export type AdminCase = {
  id: string;
  orgId: string | null;
  bookingId: string | null;
  customerId: string | null;
  ticketId: string | null;
  kind: 'exception' | 'overbooking' | 'support' | 'no_show' | 'cancellation';
  ownerId: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'open' | 'waiting' | 'resolved';
  resolution:
    | 'review'
    | 'relocation'
    | 'refund'
    | 'rebooking'
    | 'no_show_confirmed'
    | 'no_show_rejected';
  alternative: string;
  costBearer: 'platform' | 'partner' | 'customer' | 'undecided';
  createdAt: string;
  version: number;
  notes: {
    id: string;
    actor: string;
    at: string;
    body: string;
    visibility: 'internal' | 'customer';
    files: PrivateFile[];
  }[];
};
export type RefundRequest = {
  id: string;
  bookingId: string;
  orgId: string | null;
  amount: number;
  sourceLinked: boolean;
  maker: string;
  checker: string | null;
  reason: string;
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'rejected';
  version: number;
  createdAt: string;
  reference: string | null;
  files: PrivateFile[];
  sourceVersion: string;
};
export type SettlementItem = {
  key: string;
  orgId: string;
  listingId: string;
  name: string;
  amount: number;
  heldReason: string | null;
  bank: { version: number; last4: string; name: string } | null;
};
export type PayoutPreview = {
  version: string;
  expiresAt: string;
  items: SettlementItem[];
  total: number;
};
export type PayoutBatch = {
  id: string;
  maker: string;
  checker: string | null;
  status: 'review' | 'approved' | 'processing' | 'paid' | 'rejected';
  items: SettlementItem[];
  total: number;
  version: number;
  sourceVersion: string;
  reason: string;
  createdAt: string;
  reference: string | null;
  files: PrivateFile[];
};
export type GatewayEvent = {
  refundId?: string;
  id: string;
  bookingId: string | null;
  batchId: string | null;
  kind: 'payment' | 'refund' | 'payout';
  amount: number;
  reference: string;
  status: 'matched' | 'mismatch';
  at: string;
  correlationId: string;
};
export type CmsRecord = {
  id: string;
  kind: 'banner' | 'destination' | 'help' | 'policy' | 'promo';
  title: string;
  body: string;
  href: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  zone: string;
  startsAt: string;
  endsAt: string;
  status: 'draft' | 'published' | 'archived';
  listingId: string | null;
  discountPercent: number;
  basis: 'nightly_base' | 'unit_rate' | 'venue_quote' | null;
  fundedBy: 'platform' | 'partner' | null;
  version: number;
};
export type PlatformPolicy = {
  version: number;
  commissionBps: number;
  venueSlaHours: number;
  cutoffHour: number;
  refundReviewHours: number;
  effectiveAt: string;
  scope: 'future_only';
  categories: Record<PartnerCategory, boolean>;
  note: string;
};
export type ModerationDecision = {
  id: string;
  reviewId: string;
  action: 'publish' | 'retain' | 'reject';
  reason: string;
  guideline: string;
  actor: string;
  at: string;
};
export type IntegrationRecord = {
  id: string;
  name: string;
  state: 'not_connected' | 'simulated_ok' | 'simulated_error';
  checkedAt: string | null;
  logs: {
    id: string;
    correlationId: string;
    message: string;
    at: string;
    replayed: boolean;
  }[];
};
export type AdminStore = {
  actors: AdminActor[];
  verifications: Record<string, Verification>;
  cases: AdminCase[];
  refunds: RefundRequest[];
  batches: PayoutBatch[];
  gateway: GatewayEvent[];
  cms: CmsRecord[];
  policies: PlatformPolicy[];
  moderation: ModerationDecision[];
  restrictions: { accountId: string; reason: string; active: boolean }[];
  integrations: IntegrationRecord[];
  audit: AdminAudit[];
  commands: Record<string, { actor: string; resource: string; at: string }>;
  emergency: { actorId: string; reason: string; expiresAt: string }[];
};
