import { beforeEach, it, expect } from 'vitest';
import {
  verifyDemoAccount,
  signOutDemoAccount,
} from '@/features/account/lib/demo-auth';
import {
  createPartnerOrganization,
  requestBankChange,
  closePartnerSales,
  submitBusinessVerification,
} from './business';
import {
  getPartnerContext,
  readPartnerStore,
  switchPartnerMembership,
  clearPartnerSelection,
} from './store';
import { partnerAdapter } from './adapter';
import { addPartnerDemoActivities } from './demo';
import { sourceReservations, sourceInquiries } from './sources';
import {
  previewCalendarChange,
  applyCalendarChange,
  submitListingReview,
  saveListingDraft,
} from './listings';
import { decidePartnerRequest, recordPartnerService } from './reservations';
import { savePartnerQuoteDraft, sendPartnerQuote } from './crm';
import {
  partnerCustomers,
  managePartnerMember,
  respondPartnerReview,
  partnerReviews,
} from './management';
import { partnerStatement, simulatePartnerPayout } from './finance';
import { createPartnerTicket } from './support';
import { readPartnerFile } from './files';
import { partnerSalesOpen, partnerResourceDay } from './public-inventory';
import { bookingAdapter } from '@/features/hotel/lib/booking-adapter';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
const profile = {
  name: 'Partner Owner',
  email: 'owner@example.com',
  phone: '081234567890',
};
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
async function setup() {
  await verifyDemoAccount('register', profile, '123456');
  await createPartnerOrganization(
    {
      name: 'Usaha Test',
      email: 'business@example.com',
      phone: '081234567890',
      address: 'Alamat operasional lengkap di Indonesia',
    },
    true,
  );
  return getPartnerContext();
}
const calendar = (stock = 5) => ({
  start: '2099-12-10',
  end: '2099-12-12',
  stock,
  price: 1500000,
  stopSell: false,
  minStay: 1,
  buffer: 0,
  ratePlan: 'Tarif uji',
});
it('keeps organization, listing lifecycle and bank verification separate; denies Operations bank writes', async () => {
  const ctx = await setup();
  expect(ctx.organization.status).toBe('approved');
  const bank = ctx.organization.bank;
  await requestBankChange({
    name: 'Bank Baru',
    holder: 'Pemilik Usaha',
    number: '123456789012',
  });
  expect(getPartnerContext().organization.bank).toEqual(bank);
  expect(getPartnerContext().organization.pendingBank?.last4).toBe('9012');
  const ops = getPartnerContext().memberships.find(
    (m) => m.orgId === ctx.organization.id && m.role === 'operations',
  )!;
  switchPartnerMembership(ops.id);
  await expect(
    requestBankChange({ name: 'Bad', holder: 'Bad', number: '1234567890' }),
  ).rejects.toThrow('izin');
  await expect(submitBusinessVerification()).rejects.toThrow('izin');
});
it('validates listing fields by category and never auto-publishes an approved organization draft', async () => {
  await setup();
  const listing = await saveListingDraft(
    null,
    {
      category: 'car',
      name: 'Mobil Test',
      address: '',
      description: '',
      capacity: 0,
      facilities: [],
      price: 0,
      stock: 1,
      minStay: 1,
      buffer: 0,
      ratePlan: 'Standar',
    },
    0,
  );
  await expect(submitListingReview(listing.id)).rejects.toThrow('Jumlah kursi');
  const full = await saveListingDraft(
    listing.id,
    {
      ...listing,
      address: 'Alamat penjemputan lengkap',
      description: 'Paket kendaraan yang memiliki informasi lengkap.',
      capacity: 7,
      facilities: ['AC'],
      price: 500000,
    },
    listing.version,
  );
  await submitListingReview(full.id);
  expect(
    readPartnerStore().listings.find((l) => l.id === listing.id)?.status,
  ).toBe('under_review');
});
it('rejects bulk stock below confirmed+hold, stale preview versions, and applies fresh public pricing', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const row = sourceReservations(ctx).find((b) => b.status === 'confirmed')!,
    date = row.start.slice(0, 10);
  const conflict = await previewCalendarChange(row.listingId, {
    ...calendar(0),
    start: date,
    end: date,
  });
  expect(conflict.rows[0].reserved).toBeGreaterThan(0);
  await expect(applyCalendarChange(conflict, 'bad-stock')).rejects.toThrow(
    'konflik',
  );
  const p = await previewCalendarChange(row.listingId, calendar());
  await applyCalendarChange(p, 'apply-one');
  const hotel = hotelAdapter.getHotelById('seruni')!;
  const freshQuote = await hotelAdapter.previewBooking(
    hotel,
    'deluxe',
    'flex-breakfast',
    {
      locationId: 'bali',
      start: '2099-12-10',
      end: '2099-12-13',
      adults: 2,
      children: 0,
      childAges: [],
      rooms: 1,
    },
  );
  expect(freshQuote.base).toBe(4500000);
  expect(sourceReservations(ctx).find((b) => b.id === row.id)?.total).toBe(
    row.total,
  );
  expect(partnerResourceDay('seruni:deluxe', '2099-12-10')?.price).toBe(
    1500000,
  );
  await expect(applyCalendarChange(p, 'apply-stale')).rejects.toThrow(
    'berubah',
  );
  expect(sourceReservations(ctx).find((b) => b.id === row.id)?.status).toBe(
    'confirmed',
  );
}, 20000);
it('isolates organizations and serializes two decisions against the same source request', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const carOwner = getPartnerContext().memberships.find(
    (m) => m.role === 'owner' && m.orgId !== ctx.organization.id,
  )!;
  const carOrg = carOwner.orgId;
  expect(sourceReservations(ctx).every((b) => b.category !== 'car')).toBe(true);
  switchPartnerMembership(carOwner.id);
  const car = sourceReservations(getPartnerContext()).find(
    (b) => b.status === 'requested',
  )!;
  const results = await Promise.allSettled([
    decidePartnerRequest(
      car.id,
      car.version,
      'approve',
      'Kelayakan dan armada telah diperiksa',
      'decision-one',
    ),
    decidePartnerRequest(
      car.id,
      car.version,
      'reject',
      'Persyaratan belum lengkap pada pemeriksaan',
      'decision-two',
    ),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(sourceReservations(getPartnerContext())[0].status).toBe(
    'awaiting_payment',
  );
  switchPartnerMembership(ctx.membership.id);
  await expect(
    decidePartnerRequest(
      car.id,
      car.version,
      'reject',
      'Tidak diizinkan lintas organisasi',
      'foreign',
    ),
  ).rejects.toThrow();
  expect(
    (await partnerCustomers()).every((c) =>
      c.reservations.every((b) => b.category !== 'car'),
    ),
  ).toBe(true);
  expect(carOrg).not.toBe(ctx.organization.id);
}, 20000);
it('rejects early no-show and preserves service eligibility for confirmed bookings', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const b = sourceReservations(ctx).find((b) => b.status === 'confirmed')!;
  await expect(
    recordPartnerService(
      b.id,
      0,
      'no_show',
      'Pelanggan belum hadir di lokasi',
      [],
      'early',
    ),
  ).rejects.toThrow('waktu mulai');
  await recordPartnerService(
    b.id,
    0,
    'checkin',
    'Identitas dan kondisi kamar telah diperiksa',
    [],
    'checkin',
  );
  await recordPartnerService(
    b.id,
    1,
    'checkout',
    'Kunci diterima kembali dan kamar telah diperiksa',
    [],
    'checkout',
  );
  expect(sourceReservations(ctx).find((v) => v.id === b.id)?.status).toBe(
    'completed',
  );
}, 20000);
it('separates quote drafts from sending, supersedes the previous quote and checks version', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const inquiry = sourceInquiries(ctx)[0],
    old = inquiry.quotes.at(-1)!;
  const draft = await savePartnerQuoteDraft(
    inquiry.id,
    {
      lines: [{ label: 'Paket acara lengkap', amount: 7000000 }],
      tax: 700000,
      serviceFee: 250000,
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      terms: 'Penawaran untuk pembahasan kontrak dan validasi ketersediaan.',
    },
    [],
  );
  expect(sourceInquiries(ctx)[0].quotes.at(-1)?.version).toBe(old.version);
  await sendPartnerQuote(inquiry.id, draft.version, 'quote-send');
  const fresh = sourceInquiries(ctx)[0];
  expect(fresh.quotes.at(-1)?.version).toBe(old.version + 1);
  expect(fresh.quotes.find((q) => q.id === old.id)?.status).toBe('superseded');
  await expect(
    sendPartnerQuote(inquiry.id, draft.version, 'quote-stale'),
  ).rejects.toThrow('berubah');
}, 20000);
it('retains a payout snapshot and appends refund adjustment instead of erasing the payout', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const payouts = await Promise.allSettled([
    simulatePartnerPayout('payout-once'),
    simulatePartnerPayout('payout-concurrent'),
  ]);
  expect(payouts.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(readPartnerStore().payouts).toHaveLength(1);
  const before = readPartnerStore().payouts[0];
  const b = sourceReservations(ctx).find((b) => b.status === 'confirmed')!,
    preview = await bookingAdapter.previewCancellation(b.id);
  await bookingAdapter.requestCancellation(
    b.id,
    preview,
    'Rencana pelanggan berubah setelah payout',
    'refund-after-payout',
  );
  const statement = await partnerStatement('2000-01-01', '2100-01-01');
  expect(
    statement.lines.some((l) => l.kind === 'refund' && l.reference === b.id),
  ).toBe(true);
  expect(statement.lines.find((l) => l.id === before.id)?.payout).toBe(
    before.amount,
  );
  expect(readPartnerStore().payouts[0]).toEqual(before);
  expect(statement.closing).toBeLessThan(0);
}, 20000);
it('allows review reply/report without changing the score and enforces assignment revocation immediately', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const review = (await partnerReviews())[0];
  await respondPartnerReview(
    review.id,
    'reply',
    'Terima kasih atas masukan dan pengalaman Anda.',
  );
  await respondPartnerReview(
    review.id,
    'report',
    'Mohon tinjau informasi pribadi yang tercantum.',
  );
  expect((await partnerReviews())[0].score).toBe(review.score);
  const ops = getPartnerContext().memberships.find(
    (m) => m.orgId === ctx.organization.id && m.role === 'operations',
  )!;
  await managePartnerMember(
    ops.id,
    ops.version,
    'assignment',
    [],
    crypto.randomUUID(),
  );
  switchPartnerMembership(ops.id);
  expect((await partnerAdapter.getWorkspace()).listings).toEqual([]);
  await expect(
    previewCalendarChange(review.listingId, calendar()),
  ).rejects.toThrow('assignment');
  clearPartnerSelection();
  const current = readPartnerStore().memberships.find((m) => m.id === ops.id)!;
  await managePartnerMember(
    ops.id,
    current.version,
    'revoke',
    [],
    crypto.randomUUID(),
  );
  const raw = readPartnerStore();
  const selected = JSON.stringify({
    accountId: ctx.accountId,
    membershipId: ops.id,
    sessionId: JSON.parse(sessionStorage.getItem('gobuking:demo-accounts:v1')!)
      .activeSessionId,
  });
  sessionStorage.setItem('gobuking:partner-context:v1', selected);
  expect(() => getPartnerContext()).toThrow('dicabut');
  expect(raw.memberships.find((m) => m.id === ops.id)?.status).toBe('revoked');
}, 20000);
it('protects tickets, private files and customer visibility across organizations and account logout', async () => {
  const ctx = await setup();
  const ticket = await createPartnerTicket(
    {
      subject: 'Inventory perlu ditinjau',
      body: 'Mohon tinjau stok dan kronologi perubahan pada listing.',
      reference: '',
      listingId: 'PTR-HOTEL-SERUNI',
    },
    [
      new File(['%PDF-private example'], 'private.pdf', {
        type: 'application/pdf',
      }),
    ],
    'ticket-one',
  );
  expect(ticket.context).toEqual([]);
  const fileId = ticket.messages[0].files[0].id;
  expect(readPartnerFile(`ticket:${ticket.id}`, fileId).name).toBe(
    'private.pdf',
  );
  await expect(
    createPartnerTicket(
      {
        subject: 'Lampiran salah',
        body: 'Lampiran ini perlu ditinjau secara privat.',
        reference: '',
        listingId: 'PTR-HOTEL-SERUNI',
      },
      [new File(['invalid'], 'bad.pdf', { type: 'application/pdf' })],
      'bad-file',
    ),
  ).rejects.toThrow();
  const other = ctx.memberships.find(
    (m) => m.orgId !== ctx.organization.id && m.role === 'owner',
  )!;
  switchPartnerMembership(other.id);
  expect(() => readPartnerFile(`ticket:${ticket.id}`, fileId)).toThrow();
  signOutDemoAccount();
  await verifyDemoAccount(
    'register',
    { ...profile, email: 'other@example.com' },
    '123456',
  );
  expect(() => getPartnerContext()).toThrow('Belum ada organisasi');
});
it('closes new public sales while preserving confirmed bookings and financial rights', async () => {
  const ctx = await setup();
  await addPartnerDemoActivities();
  const old = sourceReservations(ctx);
  await closePartnerSales('Penghentian penjualan baru untuk evaluasi usaha');
  expect(partnerSalesOpen('hotel', 'seruni')).toBe(false);
  expect(partnerSalesOpen('home', 'nala')).toBe(false);
  expect(sourceReservations(getPartnerContext()).map((b) => b.id)).toEqual(
    old.map((b) => b.id),
  );
  const hotel = hotelAdapter.getHotelById('seruni')!;
  await expect(
    hotelAdapter.previewBooking(
      hotel,
      hotel.rooms[0].id,
      hotel.rooms[0].rates[0].id,
      {
        locationId: 'bali',
        start: '2099-12-10',
        end: '2099-12-12',
        adults: 2,
        children: 0,
        childAges: [],
        rooms: 1,
      },
    ),
  ).rejects.toThrow();
  expect(
    (await partnerStatement('2000-01-01', '2100-01-01')).entitlement,
  ).toBeGreaterThan(0);
}, 20000);
