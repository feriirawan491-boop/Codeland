import { beforeEach, it, expect } from 'vitest';
import { canDownloadBookingInvoice } from '@/features/hotel/lib/invoice';
import {
  verifyDemoAccount,
  signOutDemoAccount,
  getDemoAccount,
} from '@/features/account/lib/demo-auth';
import {
  activateAdminDemo,
  adminContext,
  readAdminStore,
  switchAdminActor,
  adminGuard,
  sanitizeLog,
} from './store';
import { addAdminExamples } from './demo';
import { adminAdapter } from './adapter';
import { adminBookings } from './sources';
import {
  decideVerification,
  updateVerification,
  verificationBlockers,
  decideListing,
  listingDuplicates,
} from './verification';
import { readPartnerStore } from '@/features/partner/lib/store';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
import {
  bookingAdapter,
  readDemoBooking,
} from '@/features/hotel/lib/booking-adapter';
import { homeAdapter } from '@/features/home-rental/lib/adapter';
import {
  previewAdminRefund,
  requestAdminRefund,
  approveAdminRefund,
  recordRefundEvidence,
  reconcilePayment,
  previewPayout,
  createPayoutBatch,
  approvePayoutBatch,
  recordTransfer,
  reconcilePayout,
} from './finance';
import {
  assignVenuePic,
  platformInquiries,
  createAdminCase,
  updateAdminCase,
  customerVisibleCase,
} from './operations';
import {
  saveCms,
  publishCms,
  toScheduledIso,
  updatePlatformPolicy,
  moderateReview,
  platformReviews,
  manageAdminActor,
  restrictAccount,
} from './content';
import { liveCms, applyPublicPromotion } from './public-content';
import { revenueMetrics } from './reports';
import {
  checkIntegration,
  replayIntegration,
  enterEmergency,
} from './integrations';
import { readAdminFile } from './files';
import { assertPurchaseEligibility } from '@/features/account/lib/purchase-eligibility';
import { DEFAULT_PLATFORM_POLICY } from '@/features/booking/lib/platform-policy';
const profile = {
    name: 'Platform Owner',
    email: 'admin@example.com',
    phone: '081234567890',
  },
  reason = 'Pemeriksaan fakta dan bukti pada simulasi platform.',
  proof = () =>
    new File(['%PDF-1.4 demo proof'], 'proof.pdf', { type: 'application/pdf' });
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
async function setup(examples = true) {
  await verifyDemoAccount('register', profile, '123456');
  await activateAdminDemo();
  if (examples) await addAdminExamples();
  return adminContext();
}
function actor(
  role:
    | 'super_admin'
    | 'partnership'
    | 'operations'
    | 'finance_maker'
    | 'finance_checker',
) {
  return readAdminStore().actors.find((a) => a.role === role)!;
}
async function paidSuite() {
  const hotel = hotelAdapter.getHotelById('seruni')!,
    room = hotel.rooms.find((r) => r.id === 'suite')!,
    query = {
      locationId: 'bali',
      start: '2099-12-10',
      end: '2099-12-12',
      adults: 2,
      children: 0,
      childAges: [],
      rooms: 1,
    },
    quote = await hotelAdapter.previewBooking(
      hotel,
      room.id,
      room.rates[0].id,
      query,
    ),
    b = await bookingAdapter.createBooking(
      {
        id: crypto.randomUUID(),
        hotelId: hotel.id,
        roomId: room.id,
        rateId: room.rates[0].id,
        query,
        quote,
        scenario: 'ready',
      },
      quote.version,
      'qris',
      { name: profile.name, email: profile.email, guestName: profile.name },
    );
  await bookingAdapter.command(b.id, 'start_payment', crypto.randomUUID());
  await bookingAdapter.command(b.id, 'payment_succeeded', crypto.randomUUID());
  return b.id;
}
it('requires verified business evidence and never activates an incomplete bank/contract', async () => {
  const ctx = await setup();
  expect(verificationBlockers(ctx, 'ORG-ADMIN-INCOMPLETE')).toContain(
    'Rekening belum tervalidasi',
  );
  await expect(
    decideVerification('ORG-ADMIN-INCOMPLETE', 1, 'approve', reason),
  ).rejects.toThrow('Aktivasi ditolak');
  await updateVerification(
    'ORG-ADMIN-READY',
    1,
    { pic: true, documents: true, bank: true, contract: true },
    [proof()],
    reason,
  );
  await decideVerification('ORG-ADMIN-READY', 1, 'approve', reason);
  expect(
    readPartnerStore().businesses.find((o) => o.id === 'ORG-ADMIN-READY')
      ?.status,
  ).toBe('approved');
  const decisions = readAdminStore().verifications['ORG-ADMIN-READY'].decisions;
  expect(decisions[0].actor).toContain('Super Admin');
  expect(decisions[0].at).toBeTruthy();
}, 20000);
it('ties duplicate cross-category inventory to one physical resource and excludes private photos', async () => {
  await setup();
  const p = readPartnerStore(),
    duplicate = p.listings.find((l) => l.id === 'ADMIN-DUPLICATE-VILLA')!,
    home = p.listings.find((l) => l.category === 'home')!;
  expect(listingDuplicates(duplicate.id).length).toBeGreaterThan(0);
  await expect(
    decideListing(duplicate.id, 1, 'publish', reason, {
      sharedWith: '',
      locationId: 'bali',
      image: 'villa',
    }),
  ).rejects.toThrow('Duplikasi');
  await expect(
    decideListing(duplicate.id, 1, 'publish', reason, {
      sharedWith: home.id,
      locationId: 'bali',
      image: '/private/evidence.pdf',
    }),
  ).rejects.toThrow('aset');
  await decideListing(duplicate.id, 1, 'publish', reason, {
    sharedWith: home.id,
    locationId: 'bali',
    image: 'villa',
  });
  const hotel = hotelAdapter.getHotelById('nala')!;
  expect(hotel.rooms[0].resourceId).toBe(home.resourceId);
  const query = {
      locationId: 'bali',
      start: '2099-12-10',
      end: '2099-12-12',
      adults: 2,
      children: 0,
      childAges: [],
      rooms: 1,
    },
    quote = await hotelAdapter.previewBooking(
      hotel,
      hotel.rooms[0].id,
      hotel.rooms[0].rates[0].id,
      query,
    );
  await bookingAdapter.createBooking(
    {
      id: 'duplicate-booking',
      hotelId: hotel.id,
      roomId: hotel.rooms[0].id,
      rateId: hotel.rooms[0].rates[0].id,
      query,
      quote,
      scenario: 'ready',
    },
    quote.version,
    'qris',
    { name: profile.name, email: profile.email, guestName: profile.name },
  );
  await expect(
    homeAdapter.previewHomeQuote(
      homeAdapter.getHomeById('nala')!,
      { ...query, rooms: 1 },
      [],
    ),
  ).rejects.toThrow('tersedia');
}, 20000);
it('preserves paid+exception facts without issuing a booking invoice and assigns an owner', async () => {
  const ctx = await setup(),
    b = adminBookings(ctx).find((b) => b.status === 'exception')!;
  expect(b.payment).toBe('succeeded');
  expect(canDownloadBookingInvoice(readDemoBooking(b.id)!)).toBe(false);
  const c = readAdminStore().cases.find((c) => c.bookingId === b.id)!;
  expect(c.ownerId).toBe(actor('operations').id);
  expect(c.alternative).toContain('refund');
}, 20000);
it('reassigns venue PIC without resetting created time or response SLA', async () => {
  const ctx = await setup(),
    i = platformInquiries(ctx)[0];
  await assignVenuePic(i.id, actor('operations').id, reason);
  const updated = platformInquiries(ctx).find((v) => v.id === i.id)!;
  expect(updated.createdAt).toBe(i.createdAt);
  expect(updated.responseDueAt).toBe(i.responseDueAt);
  expect(updated.pic?.name).toContain('Operations');
}, 20000);
it('rejects over-refunds, own approvals, duplicate gateway events, and records actual refund evidence once', async () => {
  const ctx = await setup(),
    b = adminBookings(ctx).find((b) => b.status === 'confirmed')!,
    preview = await previewAdminRefund(b.id);
  await expect(
    requestAdminRefund(b.id, b.paid + 1, preview.version, reason, 'too-much'),
  ).rejects.toThrow('melebihi');
  const request = await requestAdminRefund(
    b.id,
    100000,
    preview.version,
    reason,
    'refund-command',
  );
  await requestAdminRefund(
    b.id,
    100000,
    preview.version,
    reason,
    'refund-command',
  );
  expect(readAdminStore().refunds).toHaveLength(1);
  await expect(
    approveAdminRefund(request!.id, 1, true, reason),
  ).rejects.toThrow('sendiri');
  switchAdminActor(actor('finance_checker').id);
  await approveAdminRefund(request!.id, 1, true, reason);
  expect(readDemoBooking(b.id)?.refundStatus).toBe('processing');
  await recordRefundEvidence(
    request!.id,
    'REF-TRANSFER-123',
    [proof()],
    'refund-event-123',
    reason,
  );
  await recordRefundEvidence(
    request!.id,
    'REF-TRANSFER-123',
    [proof()],
    'refund-event-123',
    reason,
  );
  expect(
    readAdminStore().gateway.filter((v) => v.id === 'refund-event-123'),
  ).toHaveLength(1);
  expect(readDemoBooking(b.id)?.refundAmount).toBe(100000);
  expect(readDemoBooking(b.id)?.refundStatus).toBe('succeeded');
  await reconcilePayment(
    b.id,
    'payment-event-123',
    b.total,
    'PAYMENT-REF-123',
    reason,
  );
  await reconcilePayment(
    b.id,
    'payment-event-123',
    b.total,
    'PAYMENT-REF-123',
    reason,
  );
  expect(
    readAdminStore().gateway.filter((v) => v.id === 'payment-event-123'),
  ).toHaveLength(1);
}, 20000);
it('requires a different checker even in emergency mode and reconciles payout only after valid evidence', async () => {
  const ctx = await setup();
  await paidSuite();
  const preview = await previewPayout();
  expect(preview.total).toBeGreaterThan(0);
  const id = (await createPayoutBatch(preview, reason, 'batch-command'))!;
  await createPayoutBatch(preview, reason, 'batch-command');
  expect(readAdminStore().batches).toHaveLength(1);
  await enterEmergency(reason);
  await expect(approvePayoutBatch(id, 1, true, reason)).rejects.toThrow(
    'sendiri',
  );
  switchAdminActor(actor('finance_checker').id);
  await approvePayoutBatch(id, 1, true, reason);
  switchAdminActor(actor('finance_maker').id);
  await expect(
    recordTransfer(id, 'PAYOUT-REF-123', [], reason),
  ).rejects.toThrow('wajib');
  await recordTransfer(id, 'PAYOUT-REF-123', [proof()], reason);
  expect(readAdminStore().batches[0].status).toBe('processing');
  expect(readPartnerStore().payouts).toHaveLength(0);
  switchAdminActor(actor('finance_checker').id);
  await reconcilePayout(id, 'payout-event-123', reason);
  await reconcilePayout(id, 'payout-event-123', reason);
  expect(readAdminStore().batches[0].status).toBe('paid');
  expect(readPartnerStore().payouts).toHaveLength(1);
  expect(readPartnerStore().payouts[0].amount).toBe(preview.total);
  expect(readPartnerStore().payouts[0].bankVersion).toBe(
    readPartnerStore().businesses.find((o) => o.id === ctx.actor.orgIds[0])
      ?.bank?.version ?? 1,
  );
}, 20000);
it('holds disputed settlement items and reconciles unknown mutation results by correlation', async () => {
  await setup();
  const id = await paidSuite();
  await createAdminCase({
    bookingId: id,
    ticketId: null,
    customerId: getDemoAccount()!.id,
    kind: 'overbooking',
    priority: 'urgent',
    ownerId: actor('operations').id,
    resolution: 'relocation',
    alternative: 'Alternatif penginapan disiapkan untuk konfirmasi pelanggan.',
    costBearer: 'partner',
    reason,
  });
  expect(
    (await previewPayout()).items.find(
      (i) => i.listingId === 'PTR-HOTEL-SERUNI-suite',
    )?.heldReason,
  ).toContain('kasus');
  const p = await previewAdminRefund(id);
  await expect(
    requestAdminRefund(
      id,
      50000,
      p.version,
      reason,
      'unknown-command',
      false,
      'mutation_timeout',
    ),
  ).rejects.toThrow('belum diketahui');
  expect(await adminAdapter.resolveCommand('unknown-command')).not.toBeNull();
  expect(
    readAdminStore().refunds.filter((r) => r.bookingId === id),
  ).toHaveLength(1);
}, 20000);
it('keeps internal case notes out of customer messages and rejects early no-show completion', async () => {
  await setup();
  const id = await paidSuite(),
    customerId = getDemoAccount()!.id,
    c = await createAdminCase({
      bookingId: id,
      ticketId: null,
      customerId,
      kind: 'no_show',
      priority: 'normal',
      ownerId: actor('operations').id,
      resolution: 'review',
      alternative: 'Periksa kedatangan pada jadwal layanan.',
      costBearer: 'platform',
      reason,
    });
  await updateAdminCase(
    c.id,
    1,
    {
      body: 'Catatan internal yang tidak boleh dikirim ke pelanggan.',
      visibility: 'internal',
      status: 'waiting',
      resolution: 'review',
      alternative: c.alternative,
      costBearer: 'platform',
    },
    [],
  );
  expect(customerVisibleCase(c.id, customerId)).toEqual([]);
  await expect(
    updateAdminCase(
      c.id,
      2,
      {
        body: reason,
        visibility: 'customer',
        status: 'resolved',
        resolution: 'no_show_confirmed',
        alternative: c.alternative,
        costBearer: 'platform',
      },
      [proof()],
    ),
  ).rejects.toThrow('waktu mulai');
}, 20000);
it('validates promo schedules, discount basis, funding and expiry in the declared local zone', async () => {
  await setup();
  const input = {
    kind: 'promo' as const,
    title: 'Promo menginap demo',
    body: 'Penawaran contoh berdasarkan tarif dasar sebelum pajak dan biaya.',
    href: '/offers',
    image: 'hotel',
    seoTitle: 'Promo demo',
    seoDescription: 'Promo demo yang terjadwal',
    zone: 'Asia/Jakarta' as const,
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 60000).toISOString(),
    listingId: 'PTR-HOTEL-SERUNI',
    discountPercent: 10,
    basis: 'nightly_base' as const,
    fundedBy: 'platform' as const,
  };
  await expect(
    saveCms(null, 0, { ...input, endsAt: input.startsAt }),
  ).rejects.toThrow();
  await expect(
    saveCms(null, 0, { ...input, fundedBy: null }),
  ).rejects.toThrow();
  const cms = await saveCms(null, 0, input);
  expect(liveCms()).toHaveLength(0);
  await publishCms(cms.id, 1, true, reason);
  expect(liveCms()).toHaveLength(1);
  expect(applyPublicPromotion('hotel', 'seruni', 1000000).base).toBe(900000);
  expect(liveCms(Date.parse(input.endsAt))).toEqual([]);
  expect(toScheduledIso('2026-11-02T10:00', 'Asia/Makassar')).toBe(
    '2026-11-02T02:00:00.000Z',
  );
}, 20000);
it('separates GMV from platform commission and never counts venue pipeline as revenue', () => {
  const example = {
    id: 'test',
    source: 'stay' as const,
    category: 'hotel' as const,
    orgId: null,
    listingId: null,
    customerId: 'guest',
    name: 'Hotel',
    customerName: 'Guest',
    email: '',
    status: 'confirmed',
    payment: 'succeeded',
    refundStatus: 'none',
    total: 1000000,
    paid: 1000000,
    refund: 0,
    commissionBps: 1500,
    platformSubsidy: 0,
    createdAt: new Date().toISOString(),
    start: '2099-12-10',
    end: '2099-12-12',
    zone: 'Asia/Jakarta',
    version: '1',
    timeline: [],
  };
  expect(revenueMetrics([example])).toMatchObject({
    gmv: 1000000,
    commission: 150000,
    partnerEntitlement: 850000,
  });
});
it('versions future policy without rewriting existing booking snapshots', async () => {
  const ctx = await setup(),
    old = adminBookings(ctx).find((b) => b.status === 'confirmed')!;
  const snapshot = readDemoBooking(old.id)?.platformPolicy;
  await updatePlatformPolicy(1, {
    ...DEFAULT_PLATFORM_POLICY,
    commissionBps: 1500,
    venueSlaHours: 12,
    effectiveAt: new Date(Date.now() - 1000).toISOString(),
    note: reason,
  });
  expect(readDemoBooking(old.id)?.platformPolicy).toEqual(snapshot);
  const id = await paidSuite();
  expect(readDemoBooking(id)?.platformPolicy?.commissionBps).toBe(1500);
}, 20000);
it('moderates negative reviews by guideline while preserving their score', async () => {
  const ctx = await setup(),
    review = platformReviews(ctx).find((r) => r.score === 4)!;
  await expect(
    moderateReview(review.id, 'reject', 'no_violation', reason),
  ).rejects.toThrow('pelanggaran');
  await moderateReview(review.id, 'retain', 'no_violation', reason);
  expect(platformReviews(ctx).find((r) => r.id === review.id)).toMatchObject({
    score: 4,
    status: 'published',
  });
}, 20000);
it('sanitizes connector logs, denies unauthorized replay and revokes stale admin roles', async () => {
  await setup(false);
  await checkIntegration('connector-0', true);
  const log = readAdminStore().integrations[0].logs[0];
  expect(log.message).not.toContain('DEMO_PRIVATE');
  expect(
    sanitizeLog('token=secret-value card 4111111111111111 person@example.com'),
  ).not.toContain('secret-value');
  switchAdminActor(actor('operations').id);
  await expect(
    replayIntegration('connector-0', log.id, reason),
  ).rejects.toThrow('izin');
  await expect(
    readAdminFile('business', 'ORG-ADMIN-READY', 'file'),
  ).rejects.toThrow('izin');
  switchAdminActor(actor('super_admin').id);
  await replayIntegration('connector-0', log.id, reason);
  await replayIntegration('connector-0', log.id, reason);
  expect(
    readAdminStore().audit.filter((a) =>
      a.action.includes('Replay diagnostik'),
    ),
  ).toHaveLength(1);
  const ops = actor('operations');
  await manageAdminActor(
    ops.id,
    {
      name: ops.name,
      email: ops.email,
      role: ops.role,
      orgIds: [],
      active: true,
    },
    reason,
  );
  switchAdminActor(ops.id);
  expect(() => adminGuard('customer', 'foreign-org')).toThrow('lingkup');
  signOutDemoAccount();
  await verifyDemoAccount(
    'register',
    { ...profile, email: 'outsider@example.com' },
    '123456',
  );
  expect(() => adminContext()).toThrow('akses platform');
});
it('restricts new purchases while retaining the existing account session', async () => {
  await setup(false);
  const account = getDemoAccount()!;
  await restrictAccount(account.id, true, reason);
  expect(() => assertPurchaseEligibility(account.id)).toThrow('review');
  expect(getDemoAccount()?.id).toBe(account.id);
  await restrictAccount(account.id, false, reason);
  expect(() => assertPurchaseEligibility(account.id)).not.toThrow();
});
