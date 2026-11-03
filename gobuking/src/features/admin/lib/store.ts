import {
  getDemoAccount,
  currentDemoSessionId,
} from '@/features/account/lib/demo-auth';
import type {
  AdminStore,
  AdminRole,
  AdminCapability,
  AdminContext,
} from './types';
export const ADMIN_KEY = 'gobuking:admin:v1',
  ADMIN_EVENT = 'gobuking:admin-changed';
const SELECT_KEY = 'gobuking:admin-actor:v1';
export class AdminError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}
const capabilities: AdminCapability[] = [
  'read',
  'verify',
  'catalog',
  'reservation',
  'crm',
  'customer',
  'refund_request',
  'refund_approve',
  'reconcile',
  'payout_make',
  'payout_approve',
  'payout_record',
  'support',
  'cms',
  'reports',
  'settings',
  'moderation',
  'integration',
  'replay',
  'audit',
  'access',
];
export const ADMIN_CAPABILITIES: Record<AdminRole, AdminCapability[]> = {
  super_admin: capabilities,
  partnership: ['read', 'verify', 'catalog', 'crm', 'cms', 'moderation'],
  operations: [
    'read',
    'reservation',
    'crm',
    'customer',
    'support',
    'integration',
  ],
  finance_maker: [
    'read',
    'refund_request',
    'payout_make',
    'payout_record',
    'reports',
    'integration',
  ],
  finance_checker: [
    'read',
    'refund_approve',
    'reconcile',
    'payout_approve',
    'reports',
    'integration',
  ],
};
export const emptyAdminStore = (): AdminStore => ({
  actors: [],
  verifications: {},
  cases: [],
  refunds: [],
  batches: [],
  gateway: [],
  cms: [],
  policies: [],
  moderation: [],
  restrictions: [],
  integrations: [],
  audit: [],
  commands: {},
  emergency: [],
});
export function readAdminStore(): AdminStore {
  try {
    return typeof window === 'undefined'
      ? emptyAdminStore()
      : {
          ...emptyAdminStore(),
          ...JSON.parse(sessionStorage.getItem(ADMIN_KEY) ?? '{}'),
        };
  } catch {
    return emptyAdminStore();
  }
}
export function saveAdminStore(s: AdminStore) {
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(ADMIN_EVENT));
}
export function adminContext(): AdminContext {
  const account = getDemoAccount();
  if (!account)
    throw new AdminError('401', 'Masuk kembali untuk membuka panel admin.');
  const s = readAdminStore();
  let selection: { id: string; session: string | null } | null = null;
  try {
    selection = JSON.parse(sessionStorage.getItem(SELECT_KEY) ?? 'null');
  } catch {}
  const allowed = s.actors.filter(
    (a) =>
      a.active && (a.accountId === account.id || a.demoOwnerId === account.id),
  );
  const actor =
    selection?.session === currentDemoSessionId()
      ? allowed.find((a) => a.id === selection!.id)
      : (allowed.find((a) => a.accountId === account.id) ?? allowed[0]);
  if (!actor)
    throw new AdminError(
      s.actors.length ? '403' : 'BOOTSTRAP',
      s.actors.length
        ? 'Akun ini tidak memiliki akses platform aktif.'
        : 'Workspace admin demo belum diaktifkan.',
    );
  return {
    accountId: account.id,
    actor,
    actors: allowed,
    principal: actor.demoOwnerId ? actor.id : actor.accountId!,
    capabilities: ADMIN_CAPABILITIES[actor.role],
    key: `${account.id}:${currentDemoSessionId()}:${actor.id}:${actor.version}`,
  };
}
export function adminGuard(
  capability: AdminCapability = 'read',
  orgId?: string | null,
) {
  const ctx = adminContext();
  if (!ctx.capabilities.includes(capability))
    throw new AdminError(
      '403',
      'Peran admin ini tidak memiliki izin untuk tindakan tersebut.',
    );
  if (
    orgId !== undefined &&
    ctx.actor.orgIds !== 'all' &&
    (!orgId || !ctx.actor.orgIds.includes(orgId))
  )
    throw new AdminError(
      '403',
      'Resource berada di luar lingkup organisasi admin.',
    );
  return ctx;
}
export function adminScoped(ctx: AdminContext, orgId: string | null) {
  return (
    ctx.actor.orgIds === 'all' || (!!orgId && ctx.actor.orgIds.includes(orgId))
  );
}
export async function adminDelay(scenario = 'ready') {
  await new Promise((r) => setTimeout(r, scenario === 'loading' ? 1000 : 80));
  if (['error', 'timeout'].includes(scenario))
    throw new AdminError(
      'SERVICE',
      'Panel admin belum dapat dimuat. Data Anda tetap tersimpan.',
    );
  if (scenario === 'forbidden')
    throw new AdminError('403', 'Akses platform ditolak untuk lingkup ini.');
  if (scenario === 'unauthorized')
    throw new AdminError('401', 'Sesi admin berakhir. Silakan masuk kembali.');
  if (scenario === 'rate_limited')
    throw new AdminError(
      '429',
      'Terlalu banyak permintaan. Tunggu 3 detik.',
      3,
    );
}
export async function guardedAdmin(
  capability: AdminCapability = 'read',
  orgId?: string | null,
  scenario = 'ready',
) {
  const before = adminGuard(capability, orgId);
  await adminDelay(scenario);
  const after = adminGuard(capability, orgId);
  if (before.key !== after.key)
    throw new AdminError(
      '409',
      'Identitas atau izin admin berubah. Muat ulang data.',
    );
  return after;
}
export function adminAudit(
  s: AdminStore,
  ctx: AdminContext,
  action: string,
  resource: string,
  reason: string,
  orgId: string | null = null,
  correlationId = crypto.randomUUID(),
) {
  s.audit.unshift({
    id: crypto.randomUUID(),
    actorId: ctx.actor.id,
    actor: ctx.actor.name,
    role: ctx.actor.role,
    action,
    resource,
    orgId,
    reason: sanitizeLog(reason),
    at: new Date().toISOString(),
    correlationId,
  });
}
export function sanitizeLog(v: string) {
  return v
    .replace(/(bearer\s+)[\w.+\/-]+/gi, '$1[REDACTED]')
    .replace(
      /((?:token|secret|password|api[_-]?key|authorization)\s*[:=]\s*)[^\s,;}]+/gi,
      '$1[REDACTED]',
    )
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED-NUMBER]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[REDACTED-EMAIL]')
    .slice(0, 1000);
}
export function assertReason(reason: string) {
  if (reason.trim().length < 10 || reason.length > 1000)
    throw new AdminError(
      'VALIDATION',
      'Alasan minimal 10 dan maksimal 1000 karakter.',
    );
}
export function knownAdminCommand(
  s: AdminStore,
  ctx: AdminContext,
  id: string,
  resource: string,
) {
  const known = s.commands[id];
  if (!known) return false;
  if (known.actor !== ctx.principal || known.resource !== resource)
    throw new AdminError(
      '403',
      'Referensi tindakan tidak sesuai aktor dan resource.',
    );
  return true;
}
export function markAdminCommand(
  s: AdminStore,
  ctx: AdminContext,
  id: string,
  resource: string,
) {
  s.commands[id] = {
    actor: ctx.principal,
    resource,
    at: new Date().toISOString(),
  };
}
export function adminUnknown(scenario: string) {
  if (scenario === 'mutation_timeout')
    throw new AdminError(
      'UNKNOWN',
      'Hasil belum diketahui. Periksa status dengan ID tindakan sebelum mencoba kembali.',
    );
}
export function switchAdminActor(id: string) {
  const ctx = adminContext();
  if (!ctx.actors.some((a) => a.id === id))
    throw new AdminError('403', 'Persona admin tidak diizinkan.');
  sessionStorage.setItem(
    SELECT_KEY,
    JSON.stringify({ id, session: currentDemoSessionId() }),
  );
  window.dispatchEvent(new Event(ADMIN_EVENT));
}
export function clearAdminActor() {
  sessionStorage.removeItem(SELECT_KEY);
  window.dispatchEvent(new Event(ADMIN_EVENT));
}
export function adminSnapshot() {
  return typeof window === 'undefined'
    ? ''
    : `${sessionStorage.getItem(ADMIN_KEY) ?? ''}:${sessionStorage.getItem(SELECT_KEY) ?? ''}`;
}
export function subscribeAdmin(fn: () => void) {
  window.addEventListener(ADMIN_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(ADMIN_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}
export async function activateAdminDemo() {
  const account = getDemoAccount();
  if (!account)
    throw new AdminError('401', 'Masuk kembali untuk membuka panel admin.');
  const s = readAdminStore();
  if (s.actors.length)
    throw new AdminError(
      '403',
      'Workspace sudah memiliki admin. Gunakan akun yang diundang.',
    );
  for (const [role, name] of [
    ['super_admin', account.name + ' · Super Admin'],
    ['partnership', 'Nadia · Partnership'],
    ['operations', 'Raka · Operations/CS'],
    ['finance_maker', 'Dewi · Finance Maker'],
    ['finance_checker', 'Bima · Finance Checker'],
  ] as const)
    s.actors.push({
      id: crypto.randomUUID(),
      accountId: role === 'super_admin' ? account.id : null,
      demoOwnerId: account.id,
      email: role === 'super_admin' ? account.email : `${role}@example.test`,
      name,
      role,
      orgIds: 'all',
      active: true,
      version: 1,
    });
  s.integrations = [
    'Payment gateway',
    'Email delivery',
    'Inventory connector',
  ].map((name, i) => ({
    id: `connector-${i}`,
    name,
    state: 'not_connected',
    checkedAt: null,
    logs: [],
  }));
  saveAdminStore(s);
}
