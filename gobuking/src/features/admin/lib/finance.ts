import { financialProjection } from '@/features/booking/lib/financial-projection';
import {
  guardedAdmin,
  adminGuard,
  adminScoped,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  AdminError,
  assertReason,
  knownAdminCommand,
  markAdminCommand,
  adminUnknown,
} from './store';
import { getAdminBooking, adminBookings, writeSourceRefund } from './sources';
import {
  readPartnerStore,
  savePartnerStore,
} from '@/features/partner/lib/store';
import { validateAdminFiles, rememberAdminFiles } from './files';
import type {
  AdminContext,
  AdminStore,
  PayoutPreview,
  SettlementItem,
} from './types';
function alreadyGateway(
  s: AdminStore,
  eventId: string,
  expected: {
    bookingId: string | null;
    batchId: string | null;
    kind: 'payment' | 'refund' | 'payout';
    amount: number;
    reference: string;
    refundId?: string;
  },
) {
  const prior = s.gateway.find((e) => e.id === eventId);
  if (!prior) return false;
  if (
    prior.bookingId !== expected.bookingId ||
    prior.batchId !== expected.batchId ||
    prior.kind !== expected.kind ||
    prior.amount !== expected.amount ||
    prior.reference !== expected.reference ||
    prior.refundId !== expected.refundId
  )
    throw new AdminError(
      '409',
      'Event ID sudah digunakan untuk fakta keuangan lain.',
    );
  return true;
}
const activeRefund = (v: { status: string }) => v.status !== 'rejected';
function refundFacts(ctx: AdminContext, id: string, s = readAdminStore()) {
  const b = getAdminBooking(ctx, id),
    requests = s.refunds.filter((r) => r.bookingId === id && activeRefund(r)),
    linked = requests
      .filter((r) => r.sourceLinked)
      .reduce((n, r) => n + r.amount, 0),
    external = Math.max(
      0,
      b.refund -
        linked -
        requests
          .filter((r) => !r.sourceLinked && r.status !== 'requested')
          .reduce((n, r) => n + r.amount, 0),
    ),
    reserved = requests.reduce((n, r) => n + r.amount, 0);
  return {
    b,
    requests,
    external,
    remaining: Math.max(0, b.paid - external - reserved),
    version: `${b.version}:${requests.map((r) => `${r.id}.${r.version}`).join(',')}`,
  };
}
export async function previewAdminRefund(id: string) {
  const ctx = await guardedAdmin('refund_request'),
    f = refundFacts(ctx, id);
  return {
    id,
    paid: f.b.paid,
    sourcePending: f.b.refundStatus === 'succeeded' ? 0 : f.external,
    remaining: f.remaining,
    version: f.version + '|' + String(Date.now() + 300000),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
  };
}
export async function requestAdminRefund(
  id: string,
  amount: number,
  version: string,
  reason: string,
  commandId: string,
  sourceLinked = false,
  scenario = 'ready',
) {
  assertReason(reason);
  const ctx = await guardedAdmin('refund_request'),
    s = readAdminStore(),
    f = refundFacts(ctx, id, s);
  adminGuard('refund_request', f.b.orgId);
  if (knownAdminCommand(s, ctx, commandId, id))
    return s.refunds.find(
      (r) => r.bookingId === id && r.maker === ctx.principal,
    );
  if (
    f.version !== version.split('|')[0] ||
    !Number.isFinite(Number(version.split('|')[1])) ||
    Number(version.split('|')[1]) <= Date.now()
  )
    throw new AdminError(
      '409',
      'Sisa refundable berubah. Buat preview terbaru.',
    );
  if (
    (sourceLinked && f.b.refundStatus === 'succeeded') ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > (sourceLinked ? f.external : f.remaining)
  )
    throw new AdminError(
      'VALIDATION',
      'Nilai refund melebihi sisa pembayaran yang dapat dikembalikan.',
    );
  const value = {
    id: `REF-${crypto.randomUUID().slice(0, 8)}`,
    bookingId: id,
    orgId: f.b.orgId,
    amount,
    sourceLinked,
    maker: ctx.principal,
    checker: null,
    reason,
    status: 'requested' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    reference: null,
    files: [],
    sourceVersion: f.version,
  };
  s.refunds.push(value);
  markAdminCommand(s, ctx, commandId, id);
  adminAudit(
    s,
    ctx,
    'Refund diajukan untuk review',
    value.id,
    reason,
    f.b.orgId,
    commandId,
  );
  saveAdminStore(s);
  adminUnknown(scenario);
  return value;
}
export async function approveAdminRefund(
  id: string,
  version: number,
  approve: boolean,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('refund_approve'),
    s = readAdminStore(),
    r = s.refunds.find((v) => v.id === id);
  if (!r) throw new AdminError('404', 'Refund tidak ditemukan.');
  adminGuard('refund_approve', r.orgId);
  if (r.maker === ctx.principal)
    throw new AdminError(
      'SEGREGATION',
      'Maker tidak dapat menyetujui refund sendiri, termasuk Super Admin.',
    );
  if (r.status !== 'requested' || r.version !== version)
    throw new AdminError('409', 'Status refund berubah. Muat ulang review.');
  const f = refundFacts(ctx, r.bookingId, s);
  if (f.requests.reduce((n, v) => n + v.amount, 0) + f.external > f.b.paid)
    throw new AdminError(
      '409',
      'Total refund melampaui pembayaran terverifikasi.',
    );
  r.status = approve ? 'approved' : 'rejected';
  r.checker = ctx.principal;
  r.version++;
  adminAudit(
    s,
    ctx,
    approve ? 'Refund disetujui; belum dibayarkan' : 'Refund ditolak',
    id,
    reason,
    r.orgId,
  );
  saveAdminStore(s);
  if (approve) syncSourceRefund(ctx, r.bookingId);
}
function syncSourceRefund(ctx: AdminContext, id: string) {
  const f = refundFacts(ctx, id),
    approved = f.requests.filter((r) => r.status !== 'requested'),
    total = approved.reduce((n, r) => n + r.amount, 0) + f.external;
  writeSourceRefund(
    id,
    total,
    f.external === 0 &&
      approved.length > 0 &&
      approved.every((r) => r.status === 'paid'),
  );
}
export async function recordRefundEvidence(
  id: string,
  reference: string,
  files: File[],
  eventId: string,
  reason: string,
) {
  assertReason(reason);
  await validateAdminFiles(files, true);
  const ctx = await guardedAdmin('reconcile'),
    s = readAdminStore(),
    r = s.refunds.find((v) => v.id === id);
  if (!r) throw new AdminError('404', 'Refund tidak ditemukan.');
  adminGuard('reconcile', r.orgId);
  if (
    alreadyGateway(s, eventId, {
      bookingId: r.bookingId,
      batchId: null,
      kind: 'refund',
      amount: r.amount,
      reference: reference.trim(),
      refundId: r.id,
    })
  )
    return;
  if (
    !['approved', 'processing'].includes(r.status) ||
    reference.trim().length < 8 ||
    eventId.trim().length < 8
  )
    throw new AdminError(
      'VALIDATION',
      'Refund harus approved dan referensi bukti minimal 8 karakter.',
    );
  r.status = 'paid';
  r.reference = reference.trim();
  r.files.push(...rememberAdminFiles(id, files));
  r.version++;
  s.gateway.push({
    id: eventId,
    bookingId: r.bookingId,
    batchId: null,
    kind: 'refund',
    refundId: r.id,
    amount: r.amount,
    reference: r.reference,
    status: 'matched',
    at: new Date().toISOString(),
    correlationId: eventId,
  });
  adminAudit(
    s,
    ctx,
    'Refund direkonsiliasi dari bukti demo',
    id,
    reason,
    r.orgId,
    eventId,
  );
  saveAdminStore(s);
  syncSourceRefund(ctx, r.bookingId);
}
export async function reconcilePayment(
  id: string,
  eventId: string,
  amount: number,
  reference: string,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('reconcile'),
    s = readAdminStore(),
    b = getAdminBooking(ctx, id);
  adminGuard('reconcile', b.orgId);
  if (
    alreadyGateway(s, eventId, {
      bookingId: id,
      batchId: null,
      kind: 'payment',
      amount,
      reference,
    })
  )
    return;
  if (
    eventId.length < 8 ||
    reference.length < 8 ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  )
    throw new AdminError(
      'VALIDATION',
      'Lengkapi event ID, referensi, dan nominal yang valid.',
    );
  const matched = b.payment === 'succeeded' && b.total === amount;
  s.gateway.push({
    id: eventId,
    bookingId: id,
    batchId: null,
    kind: 'payment',
    amount,
    reference,
    status: matched ? 'matched' : 'mismatch',
    at: new Date().toISOString(),
    correlationId: eventId,
  });
  adminAudit(
    s,
    ctx,
    matched
      ? 'Pembayaran cocok dengan sumber'
      : 'Selisih pembayaran perlu investigasi',
    id,
    reason,
    b.orgId,
    eventId,
  );
  saveAdminStore(s);
  return matched;
}
function computePayout(
  ctx: AdminContext,
  excludeBatch?: string,
): PayoutPreview {
  const s = readAdminStore(),
    p = readPartnerStore(),
    facts = adminBookings(ctx),
    items: SettlementItem[] = [];
  for (const l of p.listings.filter((l) => adminScoped(ctx, l.orgId))) {
    const bookings = facts.filter((b) => b.listingId === l.id && b.paid > 0),
      org = p.businesses.find((o) => o.id === l.orgId)!,
      net = bookings.reduce(
        (n, b) =>
          n +
          financialProjection({
            paid: b.paid,
            refund: b.refund,
            commissionBps: b.commissionBps,
            platformSubsidy: b.platformSubsidy,
          }).entitlement,
        0,
      ),
      already = p.payouts
        .filter((v) => v.orgId === l.orgId)
        .reduce(
          (n, v) =>
            n +
            (v.allocations
              ?.filter((a) => a.listingId === l.id)
              .reduce((x, a) => x + a.amount, 0) ?? 0),
          0,
        ),
      reserved = s.batches
        .filter(
          (b) =>
            b.id !== excludeBatch && !['paid', 'rejected'].includes(b.status),
        )
        .flatMap((b) => b.items)
        .filter((i) => i.listingId === l.id)
        .reduce((n, i) => n + i.amount, 0),
      pendingRefund = s.refunds.some(
        (r) =>
          r.orgId === l.orgId &&
          r.status === 'requested' &&
          bookings.some((b) => b.id === r.bookingId),
      ),
      disputed = s.cases.some(
        (c) =>
          c.status !== 'resolved' && bookings.some((b) => b.id === c.bookingId),
      );
    const amount = Math.max(0, net - already - reserved);
    if (amount <= 0) continue;
    items.push({
      key: `${l.orgId}:${l.id}`,
      orgId: l.orgId,
      listingId: l.id,
      name: l.name,
      amount,
      heldReason: p.payouts.some(
        (v) => v.orgId === l.orgId && !v.allocations?.length,
      )
        ? 'Payout lama memerlukan rekonsiliasi alokasi'
        : bookings.some(
              (b) =>
                b.paid > b.refund &&
                !['confirmed', 'completed', 'in_use', 'cancelled'].includes(
                  b.status,
                ),
            )
          ? 'Pembayaran tanpa reservasi sah perlu penyelesaian'
          : !org.bank
            ? 'Rekening belum terverifikasi'
            : pendingRefund
              ? 'Refund masih menunggu review'
              : disputed
                ? 'Item memiliki kasus atau sengketa terbuka'
                : null,
      bank: org.bank
        ? {
            version: org.bank.version,
            last4: org.bank.last4,
            name: org.bank.name,
          }
        : null,
    });
  }
  const version = JSON.stringify({
    bookings: facts.map((b) => [b.id, b.version, b.commissionBps]),
    banks: p.businesses
      .filter((o) => adminScoped(ctx, o.id))
      .map((o) => [o.id, o.bank?.version]),
    payouts: p.payouts.map((v) => v.id),
    cases: s.cases.map((c) => [c.id, c.version, c.status]),
    refunds: s.refunds.map((r) => [r.id, r.version, r.status]),
    batches: s.batches
      .filter(
        (b) =>
          b.id !== excludeBatch && !['paid', 'rejected'].includes(b.status),
      )
      .map((b) => [b.id, b.version]),
  });
  return {
    version,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    items,
    total: items.filter((i) => !i.heldReason).reduce((n, i) => n + i.amount, 0),
  };
}
export async function previewPayout() {
  const ctx = await guardedAdmin('payout_make');
  return computePayout(ctx);
}
export async function createPayoutBatch(
  preview: PayoutPreview,
  reason: string,
  commandId: string,
  scenario = 'ready',
) {
  assertReason(reason);
  const ctx = await guardedAdmin('payout_make'),
    s = readAdminStore();
  if (knownAdminCommand(s, ctx, commandId, 'payout')) return;
  const fresh = computePayout(ctx);
  if (
    fresh.version !== preview.version ||
    Date.parse(preview.expiresAt) <= Date.now()
  )
    throw new AdminError(
      '409',
      'Eligibility payout berubah. Tinjau preview terbaru.',
    );
  const items = fresh.items.filter((i) => !i.heldReason);
  if (!items.length)
    throw new AdminError('VALIDATION', 'Tidak ada item eligible untuk batch.');
  const id = `BATCH-${crypto.randomUUID().slice(0, 8)}`;
  s.batches.push({
    id,
    maker: ctx.principal,
    checker: null,
    status: 'review',
    items,
    total: fresh.total,
    version: 1,
    sourceVersion: fresh.version,
    reason,
    createdAt: new Date().toISOString(),
    reference: null,
    files: [],
  });
  markAdminCommand(s, ctx, commandId, 'payout');
  adminAudit(
    s,
    ctx,
    'Batch payout dibuat untuk pemeriksaan terpisah',
    id,
    reason,
    null,
    commandId,
  );
  saveAdminStore(s);
  adminUnknown(scenario);
  return id;
}
function checkBatchFresh(
  ctx: AdminContext,
  batch: AdminStore['batches'][number],
) {
  const fresh = computePayout(ctx, batch.id);
  for (const item of batch.items) {
    adminGuard('payout_approve', item.orgId);
    const latest = fresh.items.find((i) => i.key === item.key);
    if (
      !latest ||
      latest.heldReason ||
      latest.amount < item.amount ||
      latest.bank?.version !== item.bank?.version
    )
      throw new AdminError(
        '409',
        'Item, sengketa, atau rekening berubah. Batch perlu ditinjau ulang.',
      );
  }
}
export async function approvePayoutBatch(
  id: string,
  version: number,
  approve: boolean,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('payout_approve'),
    s = readAdminStore(),
    b = s.batches.find((v) => v.id === id);
  if (!b) throw new AdminError('404', 'Batch tidak ditemukan.');
  if (b.maker === ctx.principal)
    throw new AdminError(
      'SEGREGATION',
      'Maker tidak dapat menyetujui batch sendiri, termasuk Super Admin.',
    );
  if (b.status !== 'review' || b.version !== version)
    throw new AdminError('409', 'Status batch berubah. Muat ulang.');
  if (approve) checkBatchFresh(ctx, b);
  b.items.forEach((i) => adminGuard('payout_approve', i.orgId));
  b.status = approve ? 'approved' : 'rejected';
  b.checker = ctx.principal;
  b.version++;
  adminAudit(
    s,
    ctx,
    approve
      ? 'Batch disetujui checker; belum dibayar'
      : 'Batch ditolak checker',
    id,
    reason,
  );
  saveAdminStore(s);
}
export async function recordTransfer(
  id: string,
  reference: string,
  files: File[],
  reason: string,
) {
  assertReason(reason);
  await validateAdminFiles(files, true);
  const ctx = await guardedAdmin('payout_record'),
    s = readAdminStore(),
    b = s.batches.find((v) => v.id === id);
  if (!b) throw new AdminError('404', 'Batch tidak ditemukan.');
  b.items.forEach((i) => adminGuard('payout_record', i.orgId));
  if (
    b.status !== 'approved' ||
    reference.trim().length < 8 ||
    s.batches.some((v) => v.id !== id && v.reference === reference)
  )
    throw new AdminError(
      'VALIDATION',
      'Batch harus approved dan referensi transfer harus unik, minimal 8 karakter.',
    );
  b.reference = reference.trim();
  b.files = rememberAdminFiles(id, files);
  b.status = 'processing';
  b.version++;
  adminAudit(
    s,
    ctx,
    'Bukti transfer dicatat; menunggu rekonsiliasi',
    id,
    reason,
  );
  saveAdminStore(s);
}
export async function reconcilePayout(
  id: string,
  eventId: string,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('reconcile'),
    s = readAdminStore(),
    b = s.batches.find((v) => v.id === id);
  if (!b) throw new AdminError('404', 'Batch tidak ditemukan.');
  b.items.forEach((i) => adminGuard('reconcile', i.orgId));
  if (b.status === 'paid') {
    if (s.gateway.some((e) => e.id === eventId))
      alreadyGateway(s, eventId, {
        bookingId: null,
        batchId: id,
        kind: 'payout',
        amount: b.total,
        reference: b.reference!,
      });
    return;
  }
  if (
    alreadyGateway(s, eventId, {
      bookingId: null,
      batchId: id,
      kind: 'payout',
      amount: b.total,
      reference: b.reference!,
    })
  )
    return;
  if (b.maker === ctx.principal)
    throw new AdminError(
      'SEGREGATION',
      'Maker tidak dapat merekonsiliasi batch sendiri.',
    );
  if (
    b.status !== 'processing' ||
    !b.reference ||
    !b.files.length ||
    eventId.length < 8
  )
    throw new AdminError(
      'VALIDATION',
      'Referensi, bukti transfer, dan event rekonsiliasi wajib sebelum paid.',
    );
  checkBatchFresh(ctx, b);
  const p = readPartnerStore();
  for (const orgId of [...new Set(b.items.map((i) => i.orgId))]) {
    const items = b.items.filter((i) => i.orgId === orgId),
      bank = items[0].bank!;
    const payoutId = `${id}:${orgId}`;
    if (!p.payouts.some((v) => v.id === payoutId))
      p.payouts.push({
        id: payoutId,
        orgId,
        amount: items.reduce((n, i) => n + i.amount, 0),
        at: new Date().toISOString(),
        bankVersion: bank.version,
        bankLast4: bank.last4,
        allocations: items.map((i) => ({
          listingId: i.listingId,
          amount: i.amount,
        })),
      });
  }
  b.status = 'paid';
  b.version++;
  s.gateway.push({
    id: eventId,
    bookingId: null,
    batchId: id,
    kind: 'payout',
    amount: b.total,
    reference: b.reference,
    status: 'matched',
    at: new Date().toISOString(),
    correlationId: eventId,
  });
  adminAudit(
    s,
    ctx,
    'Payout direkonsiliasi paid dari bukti demo',
    id,
    reason,
    null,
    eventId,
  );
  savePartnerStore(p);
  saveAdminStore(s);
}
