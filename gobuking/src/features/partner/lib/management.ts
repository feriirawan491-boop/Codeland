import {
  guarded,
  partnerGuard,
  readPartnerStore,
  savePartnerStore,
  ownListings,
  recordActivity,
  PartnerError,
  markCommand,
  knownCommand,
} from './store';
import { sourceReservations, sourceInquiries } from './sources';
import { memberSchema, reasonSchema } from './schemas';
import type { AccountReview } from '@/features/dashboard/lib/types';
import {
  readDashboardStore,
  saveDashboardRecord,
} from '@/features/dashboard/lib/store';
export async function partnerCustomers() {
  const ctx = await guarded('customer'),
    reservations = sourceReservations(ctx),
    inquiries = sourceInquiries(ctx);
  const result = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      reservations: typeof reservations;
      inquiries: typeof inquiries;
      note: string;
    }
  >();
  for (const b of reservations) {
    const key = b.customerId;
    const v = result.get(key) ?? {
      id: key,
      name: b.customerName,
      email: b.email,
      phone: b.phone,
      reservations: [],
      inquiries: [],
      note:
        readPartnerStore().customerNotes[`${ctx.organization.id}:${key}`] ?? '',
    };
    v.reservations.push(b);
    result.set(key, v);
  }
  for (const i of inquiries) {
    const key = i.ownerId ?? `inquiry:${i.id}`;
    const v = result.get(key) ?? {
      id: key,
      name: i.contact.name,
      email: i.contact.email,
      phone: i.contact.phone,
      reservations: [],
      inquiries: [],
      note:
        readPartnerStore().customerNotes[`${ctx.organization.id}:${key}`] ?? '',
    };
    v.inquiries.push(i);
    result.set(key, v);
  }
  return [...result.values()];
}
export async function saveCustomerNote(id: string, note: string) {
  if (note.length > 1500)
    throw new PartnerError('VALIDATION', 'Catatan maksimal 1500 karakter.');
  const ctx = await guarded('customer');
  if (!(await partnerCustomers()).some((c) => c.id === id))
    throw new PartnerError(
      '403',
      'Pelanggan tidak termasuk organisasi dan assignment Anda.',
    );
  const current = partnerGuard('customer');
  if (current.sessionKey !== ctx.sessionKey)
    throw new PartnerError('409', 'Konteks berubah. Muat ulang data.');
  const s = readPartnerStore();
  s.customerNotes[`${ctx.organization.id}:${id}`] = note.trim();
  recordActivity(s, ctx, 'Catatan layanan pelanggan diperbarui', id);
  savePartnerStore(s);
}
export async function partnerReviews() {
  const ctx = await guarded('review'),
    bookings = sourceReservations(ctx);
  return Object.values(
    readDashboardStore<AccountReview>('gobuking:account-reviews:v1'),
  )
    .filter(
      (r) =>
        r.status === 'published' && bookings.some((b) => b.id === r.bookingId),
    )
    .map((r) => ({
      ...r,
      listingId: bookings.find((b) => b.id === r.bookingId)!.listingId,
    }));
}
export async function respondPartnerReview(
  id: string,
  action: 'reply' | 'report',
  text: string,
) {
  reasonSchema.parse(text);
  const ctx = await guarded('review'),
    reviews = await partnerReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review)
    throw new PartnerError(
      '403',
      'Ulasan tidak termasuk organisasi dan assignment Anda.',
    );
  const latest = partnerGuard('review', review.listingId);
  if (latest.sessionKey !== ctx.sessionKey)
    throw new PartnerError('409', 'Izin berubah. Muat ulang ulasan.');
  const s = readPartnerStore();
  if (action === 'reply') {
    const all = readDashboardStore<AccountReview>(
      'gobuking:account-reviews:v1',
    );
    const value = all[id];
    value.reply = text.trim();
    saveDashboardRecord('gobuking:account-reviews:v1', id, value);
  } else
    s.reviewReports.push({
      id: crypto.randomUUID(),
      orgId: ctx.organization.id,
      reviewId: id,
      reason: text.trim(),
      at: new Date().toISOString(),
    });
  recordActivity(
    s,
    ctx,
    action === 'reply'
      ? 'Ulasan dibalas'
      : 'Pelanggaran ulasan dilaporkan untuk moderasi',
    id,
    review.listingId,
  );
  savePartnerStore(s);
}
export async function invitePartnerMember(
  input: Parameters<typeof memberSchema.parse>[0],
) {
  const valid = memberSchema.parse(input),
    ctx = await guarded('team'),
    s = readPartnerStore();
  if (valid.listingIds.some((id) => !ownListings(ctx).some((l) => l.id === id)))
    throw new PartnerError('403', 'Assignment listing tidak diizinkan.');
  if (
    s.memberships.some(
      (m) =>
        m.orgId === ctx.organization.id &&
        m.email === valid.email &&
        m.status !== 'revoked',
    )
  )
    throw new PartnerError(
      'VALIDATION',
      'Email staf sudah memiliki undangan atau akses.',
    );
  s.memberships.push({
    ...valid,
    id: crypto.randomUUID(),
    orgId: ctx.organization.id,
    accountId: null,
    demoOwnerId: null,
    status: 'invited',
    version: 1,
  });
  recordActivity(s, ctx, 'Undangan staf dicatat', ctx.organization.id);
  savePartnerStore(s);
}
export async function managePartnerMember(
  id: string,
  version: number,
  action: 'revoke' | 'assignment',
  listingIds: string[],
  commandId: string,
) {
  const ctx = await guarded('team'),
    s = readPartnerStore(),
    m = s.memberships.find(
      (m) => m.id === id && m.orgId === ctx.organization.id,
    );
  if (!m || m.role === 'owner')
    throw new PartnerError(
      '403',
      'Akses Owner tidak dapat diubah melalui tindakan ini.',
    );
  if (knownCommand(s, ctx, commandId, id)) return;
  if (m.version !== version)
    throw new PartnerError(
      '409',
      'Assignment staf berubah. Muat ulang izin terbaru.',
    );
  if (listingIds.some((id) => !ownListings(ctx).some((l) => l.id === id)))
    throw new PartnerError('403', 'Assignment lintas organisasi ditolak.');
  if (action === 'revoke') m.status = 'revoked';
  else m.listingIds = listingIds;
  m.version++;
  markCommand(s, ctx, commandId, id);
  recordActivity(
    s,
    ctx,
    action === 'revoke'
      ? 'Akses staf dicabut; sesi lama ditolak'
      : 'Assignment staf diperbarui',
    id,
  );
  savePartnerStore(s);
}
export async function acceptPartnerInvitation(id: string, code: string) {
  const { getDemoAccount } = await import('@/features/account/lib/demo-auth');
  const a = getDemoAccount(),
    s = readPartnerStore(),
    m = s.memberships.find((m) => m.id === id && m.status === 'invited');
  if (!a || !m || a.email !== m.email || code !== '123456')
    throw new PartnerError('403', 'Undangan dan verifikasi akun tidak sesuai.');
  m.accountId = a.id;
  m.status = 'active';
  m.version++;
  savePartnerStore(s);
}
