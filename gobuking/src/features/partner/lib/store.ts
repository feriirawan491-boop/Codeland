import {
  getDemoAccount,
  currentDemoSessionId,
} from '@/features/account/lib/demo-auth';
import type {
  PartnerStore,
  PartnerContext,
  Capability,
  PartnerRole,
  PartnerListing,
} from './types';
export const PARTNER_KEY = 'gobuking:partner:v1',
  PARTNER_EVENT = 'gobuking:partner-changed';
const CONTEXT_KEY = 'gobuking:partner-context:v1';
export class PartnerError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'PartnerError';
  }
}
export const emptyPartnerStore = (): PartnerStore => ({
  businesses: [],
  memberships: [],
  listings: [],
  calendars: {},
  calendarVersions: {},
  activities: [],
  tickets: [],
  services: [],
  customerNotes: {},
  quoteDrafts: {},
  quoteFiles: {},
  reviewReports: [],
  payouts: [],
  commands: {},
});
export function readPartnerStore(): PartnerStore {
  try {
    return typeof window === 'undefined'
      ? emptyPartnerStore()
      : {
          ...emptyPartnerStore(),
          ...JSON.parse(sessionStorage.getItem(PARTNER_KEY) ?? '{}'),
        };
  } catch {
    return emptyPartnerStore();
  }
}
export function savePartnerStore(s: PartnerStore) {
  sessionStorage.setItem(PARTNER_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(PARTNER_EVENT));
}
const ALL: Capability[] = [
  'read',
  'business',
  'bank',
  'listing',
  'inventory',
  'reservation',
  'operation',
  'crm',
  'customer',
  'review',
  'finance',
  'team',
  'audit',
  'support',
  'closure',
];
export const ROLE_CAPABILITIES: Record<PartnerRole, Capability[]> = {
  owner: ALL,
  operations: [
    'read',
    'listing',
    'inventory',
    'reservation',
    'operation',
    'crm',
    'customer',
    'review',
    'support',
  ],
  finance: ['read', 'finance', 'support'],
};
function selected() {
  try {
    return JSON.parse(sessionStorage.getItem(CONTEXT_KEY) ?? 'null') as {
      accountId: string;
      membershipId: string;
      sessionId: string | null;
    } | null;
  } catch {
    return null;
  }
}
export function getPartnerContext(): PartnerContext {
  const account = getDemoAccount();
  if (!account)
    throw new PartnerError('401', 'Masuk kembali untuk membuka ruang mitra.');
  const s = readPartnerStore(),
    selection = selected();
  const allowed = s.memberships.filter(
    (m) =>
      m.status === 'active' &&
      (m.accountId === account.id || m.demoOwnerId === account.id),
  );
  let membership =
    selection?.accountId === account.id &&
    selection.sessionId === currentDemoSessionId()
      ? allowed.find((m) => m.id === selection.membershipId)
      : allowed.find((m) => m.accountId === account.id);
  if (
    selection?.accountId === account.id &&
    selection.sessionId === currentDemoSessionId() &&
    !membership
  )
    throw new PartnerError(
      '403',
      'Akses staf dicabut. Pilih organisasi yang masih diizinkan.',
    );
  membership ??= allowed[0];
  if (!membership)
    throw new PartnerError(
      'ONBOARDING',
      'Belum ada organisasi mitra untuk akun ini.',
    );
  const organization = s.businesses.find((o) => o.id === membership.orgId);
  if (!organization)
    throw new PartnerError('404', 'Organisasi tidak tersedia.');
  return {
    accountId: account.id,
    membership,
    organization,
    capabilities: ROLE_CAPABILITIES[membership.role],
    sessionKey: `${currentDemoSessionId()}:${membership.id}:${membership.version}:${organization.version}`,
    organizations: s.businesses
      .filter((o) => allowed.some((m) => m.orgId === o.id))
      .map((o) => ({
        id: o.id,
        name: o.name,
        role: allowed.find((m) => m.orgId === o.id)!.role,
      })),
    memberships: allowed,
  };
}
export function partnerGuard(
  capability: Capability = 'read',
  listingId?: string,
) {
  const ctx = getPartnerContext();
  if (!ctx.capabilities.includes(capability))
    throw new PartnerError(
      '403',
      'Peran ini tidak memiliki izin untuk tindakan tersebut.',
    );
  if (listingId) {
    const listing = readPartnerStore().listings.find(
      (l) => l.id === listingId && l.orgId === ctx.organization.id,
    );
    if (
      !listing ||
      (ctx.membership.role !== 'owner' &&
        !ctx.membership.listingIds.includes(listingId))
    )
      throw new PartnerError(
        '403',
        'Listing tidak termasuk assignment organisasi Anda.',
      );
  }
  return ctx;
}
export function ownListings(ctx = getPartnerContext()): PartnerListing[] {
  return readPartnerStore().listings.filter(
    (l) =>
      l.orgId === ctx.organization.id &&
      (ctx.membership.role === 'owner' ||
        ctx.membership.listingIds.includes(l.id)),
  );
}
export function switchPartnerMembership(id: string) {
  const ctx = getPartnerContext();
  const m = ctx.memberships.find((v) => v.id === id);
  if (!m)
    throw new PartnerError('403', 'Organisasi atau persona tidak diizinkan.');
  sessionStorage.setItem(
    CONTEXT_KEY,
    JSON.stringify({
      accountId: ctx.accountId,
      membershipId: id,
      sessionId: currentDemoSessionId(),
    }),
  );
  window.dispatchEvent(new Event(PARTNER_EVENT));
}
export function clearPartnerSelection() {
  sessionStorage.removeItem(CONTEXT_KEY);
  window.dispatchEvent(new Event(PARTNER_EVENT));
}
export function recordActivity(
  s: PartnerStore,
  ctx: PartnerContext,
  action: string,
  resource: string,
  listingId: string | null = null,
) {
  s.activities.unshift({
    id: crypto.randomUUID(),
    orgId: ctx.organization.id,
    listingId,
    actor: ctx.membership.name,
    action,
    resource,
    at: new Date().toISOString(),
  });
}
export async function partnerDelay(scenario = 'ready') {
  await new Promise((r) => setTimeout(r, scenario === 'loading' ? 1000 : 100));
  if (scenario === 'error' || scenario === 'timeout')
    throw new PartnerError(
      'SERVICE',
      'Ruang mitra belum dapat dimuat. Coba lagi.',
    );
  if (scenario === 'forbidden')
    throw new PartnerError(
      '403',
      'Anda tidak memiliki akses ke organisasi ini.',
    );
  if (scenario === 'unauthorized')
    throw new PartnerError('401', 'Masuk kembali untuk membuka ruang mitra.');
  if (scenario === 'rate_limited')
    throw new PartnerError(
      '429',
      'Terlalu banyak permintaan. Coba lagi setelah 3 detik.',
      3,
    );
}
export async function guarded(
  capability: Capability = 'read',
  listingId?: string,
  scenario = 'ready',
) {
  const before = partnerGuard(capability, listingId);
  await partnerDelay(scenario);
  const after = partnerGuard(capability, listingId);
  if (
    before.accountId !== after.accountId ||
    before.sessionKey !== after.sessionKey
  )
    throw new PartnerError(
      '409',
      'Konteks organisasi atau izin berubah. Muat ulang sebelum melanjutkan.',
    );
  return after;
}
export function markCommand(
  s: PartnerStore,
  ctx: PartnerContext,
  id: string,
  resource: string,
) {
  s.commands[id] = {
    orgId: ctx.organization.id,
    actorId: ctx.membership.id,
    resource,
    at: new Date().toISOString(),
  };
}
export function knownCommand(
  s: PartnerStore,
  ctx: PartnerContext,
  id: string,
  resource: string,
) {
  const known = s.commands[id];
  if (!known) return false;
  if (
    known.orgId !== ctx.organization.id ||
    known.actorId !== ctx.membership.id ||
    known.resource !== resource
  )
    throw new PartnerError('403', 'Referensi tindakan tidak dapat diakses.');
  return true;
}
export function unknownPartnerResult(scenario: string) {
  if (scenario === 'mutation_timeout')
    throw new PartnerError(
      'UNKNOWN',
      'Hasil belum diketahui. Periksa status tindakan sebelum mengirim ulang.',
    );
}
export function partnerSnapshot() {
  return typeof window === 'undefined'
    ? ''
    : `${sessionStorage.getItem(PARTNER_KEY) ?? ''}|${sessionStorage.getItem(CONTEXT_KEY) ?? ''}`;
}
export function subscribePartner(callback: () => void) {
  window.addEventListener(PARTNER_EVENT, callback);
  window.addEventListener('storage', callback);
  window.addEventListener('focus', callback);
  return () => {
    window.removeEventListener(PARTNER_EVENT, callback);
    window.removeEventListener('storage', callback);
    window.removeEventListener('focus', callback);
  };
}
