import { beforeEach, expect, it } from 'vitest';
import {
  verifyDemoAccount,
  signOutDemoAccount,
  getDemoAccount,
  beginDemoContactChange,
  verifyDemoContactChange,
  currentDemoSessionId,
  validateDemoSession,
  revokeDemoSession,
} from '@/features/account/lib/demo-auth';
import { writeSavedIds, readSavedIds } from '@/lib/saved-store';
import { createDashboardDemo } from './demo';
import {
  getAllMyBookings,
  getMyBookings,
  previewCancellation,
  requestCancellation,
  getMyBooking,
} from './bookings';
import { parseListFilters } from './query';
import { bookingAdapter } from '@/features/hotel/lib/booking-adapter';
import { reviewEligibility, submitReview, listMyReviews } from './reviews';
import {
  createSupportTicket,
  getSupportTicket,
  resolveSupportSubmission,
  readSupportAttachment,
} from './support';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
const input = {
  name: 'Dashboard Guest',
  email: 'dashboard@example.com',
  phone: '081234567890',
};
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
async function login() {
  return verifyDemoAccount('register', input, '123456');
}
it('aggregates source bookings, filters service vs creation dates, and rejects another account', async () => {
  await login();
  expect(await getAllMyBookings()).toEqual([]);
  await createDashboardDemo();
  const rows = await getAllMyBookings();
  expect(rows).toHaveLength(5);
  expect(new Set(rows.map((v) => v.category))).toEqual(
    new Set(['hotel', 'home', 'car']),
  );
  expect(rows.filter((v) => v.history)).toHaveLength(2);
  const filters = parseListFilters(new URLSearchParams());
  filters.to = new Date().toISOString().slice(0, 10);
  expect(await getMyBookings(filters, false)).toHaveLength(0);
  expect(
    (await getMyBookings({ ...filters, dateKind: 'created' }, false)).length,
  ).toBeGreaterThan(0);
  signOutDemoAccount();
  await verifyDemoAccount(
    'register',
    { ...input, email: 'other@example.com' },
    '123456',
  );
  expect(await getAllMyBookings()).toEqual([]);
  await expect(getMyBooking(rows[0].id)).rejects.toThrow();
}, 20000);
it('keeps contact and source booking snapshots stable until verified', async () => {
  const owner = await login();
  await createDashboardDemo();
  const b = (await getAllMyBookings()).find((v) => v.category === 'hotel')!;
  const challenge = await beginDemoContactChange(
    'email',
    'changed@example.com',
  );
  expect(getDemoAccount()?.email).toBe(input.email);
  await expect(
    verifyDemoContactChange(challenge.id, '000000'),
  ).rejects.toThrow();
  await verifyDemoContactChange(challenge.id, '123456');
  expect(getDemoAccount()?.email).toBe('changed@example.com');
  expect(getDemoAccount()?.id).toBe(owner.id);
  expect((await getMyBooking(b.id)).value.customerId).toBe(owner.id);
  const snapshot = await getMyBooking(b.id);
  if (snapshot.kind === 'stay')
    expect(snapshot.value.contact?.email).toBe(input.email);
}, 20000);
it('requires a new preview after the cancellation boundary changes and records partial refund in the source', async () => {
  await login();
  await createDashboardDemo();
  const row = (await getAllMyBookings()).find((b) => b.status === 'confirmed')!;
  const old = await previewCancellation(row.id);
  expect(old.fee).toBe(Math.round(old.paid * 0.25));
  await bookingAdapter.simulateCancellationDeadline(row.id);
  await expect(
    requestCancellation(
      row.id,
      old,
      'Perubahan rencana perjalanan',
      crypto.randomUUID(),
    ),
  ).rejects.toThrow();
  const fresh = await previewCancellation(row.id);
  expect(fresh.feePercent).toBe(50);
  await requestCancellation(
    row.id,
    fresh,
    'Perubahan rencana perjalanan',
    crypto.randomUUID(),
  );
  const record = await getMyBooking(row.id);
  expect(record.kind).toBe('stay');
  if (record.kind === 'stay') {
    expect(record.value.refundStatus).toBe('processing');
    expect(record.value.refundAmount).toBe(fresh.refund);
    expect(record.value.cancellationPolicy?.feePercent).toBe(25);
  }
}, 20000);
it('creates one pending review for a completed service and leaves public scores untouched', async () => {
  await login();
  await createDashboardDemo();
  const eligible = (await reviewEligibility()).find((v) => v.eligible)!;
  const input = {
    bookingId: eligible.booking.id,
    score: 9,
    title: 'Pengalaman menyenangkan',
    body: 'Kamar bersih dan pelayanan sangat menyenangkan.',
    subscore: null,
  };
  await submitReview(input, 'review-command');
  await submitReview(input, 'review-command');
  expect(await listMyReviews()).toHaveLength(1);
  expect((await listMyReviews())[0].status).toBe('pending');
  expect(
    (await reviewEligibility()).find((v) => v.booking.id === input.bookingId)
      ?.eligible,
  ).toBe(false);
}, 20000);
it('reconciles unknown ticket submission without duplication and rejects foreign tickets and attachments', async () => {
  await login();
  const ticket = {
    subject: 'Bantuan perjalanan saya',
    category: 'general' as const,
    referenceId: '',
    body: 'Mohon bantu meninjau rencana perjalanan saya.',
  };
  await expect(
    createSupportTicket(ticket, [], 'command-one', 'mutation_timeout'),
  ).rejects.toThrow('belum diketahui');
  const saved = await resolveSupportSubmission('command-one');
  expect(saved).not.toBeNull();
  expect((await createSupportTicket(ticket, [], 'command-one')).id).toBe(
    saved?.id,
  );
  await expect(
    createSupportTicket(
      ticket,
      [new File(['bad'], 'bad.exe', { type: 'application/x-msdownload' })],
      'bad-file',
    ),
  ).rejects.toThrow();
  signOutDemoAccount();
  await verifyDemoAccount(
    'register',
    { ...input, email: 'foreign@example.com' },
    '123456',
  );
  await expect(getSupportTicket(saved!.id)).rejects.toThrow();
  await expect(readSupportAttachment(saved!.id, 'file')).rejects.toThrow();
});
it('creates a privacy verification ticket without deleting transactions', async () => {
  await login();
  await createDashboardDemo();
  const before = await getAllMyBookings();
  const ticket = await createSupportTicket(
    {
      subject: 'Permintaan privasi akun',
      category: 'privacy_delete',
      referenceId: '',
      body: 'Saya ingin mengajukan peninjauan penghapusan data pribadi.',
    },
    [],
    'privacy',
  );
  expect(ticket.status).toBe('verification_required');
  expect(await getAllMyBookings()).toHaveLength(before.length);
}, 20000);
it('isolates favorites and invalidates revoked session tokens', async () => {
  writeSavedIds(['nala']);
  const a = await login();
  expect(readSavedIds(a.id)).toEqual(['nala']);
  signOutDemoAccount();
  expect(readSavedIds()).toEqual([]);
  const b = await verifyDemoAccount(
    'register',
    { ...input, email: 'second@example.com' },
    '123456',
  );
  expect(readSavedIds(b.id)).toEqual([]);
  const session = currentDemoSessionId()!;
  expect(validateDemoSession(session)).toBeTruthy();
  revokeDemoSession(session);
  expect(() => validateDemoSession(session)).toThrow('Sesi dicabut');
  expect(getDemoAccount()).toBeNull();
});
it('rejects a matching-email claim until the inquiry contact itself is verified', async () => {
  const inquiry = await inquiryAdapter.createInquiry(
    {
      service: 'mice',
      spaceId: 'cendana-hall',
      packageId: 'cendana-hall-full',
      contact: { ...input, company: 'Demo' },
      event: {
        locationId: 'jakarta',
        flexible: true,
        start: '',
        end: '',
        startTime: '09:00',
        endTime: '17:00',
        participants: 50,
        layout: 'theater',
        eventType: 'meeting',
      },
      needs: { av: true, catering: true, rooms: 0, notes: '' },
      consent: true,
    },
    'claim-test',
  );
  const token = inquiryAdapter.getClaimToken(inquiry.id)!;
  const a = await login();
  await expect(
    inquiryAdapter.claimInquiry(inquiry.id, token, 'claim-one'),
  ).rejects.toThrow('belum dapat diklaim');
  expect(await inquiryAdapter.listMyInquiries()).toHaveLength(0);
  await inquiryAdapter.verifyInquiryContact(inquiry.id, '123456');
  await expect(
    inquiryAdapter.claimInquiry(inquiry.id, 'wrong', 'claim-two'),
  ).rejects.toThrow();
  expect(
    (await inquiryAdapter.claimInquiry(inquiry.id, token, 'claim-three'))
      .ownerId,
  ).toBe(a.id);
});

it('rejects an expired session and keeps an OTP challenge bound to its original session', async () => {
  await login();
  const challenge = await beginDemoContactChange('phone', '089876543210');
  signOutDemoAccount();
  await verifyDemoAccount('login', input, '123456');
  await expect(verifyDemoContactChange(challenge.id, '123456')).rejects.toThrow(
    'tidak dapat diakses',
  );
  expect(getDemoAccount()?.phone).toBe(input.phone);
  const session = currentDemoSessionId()!;
  const raw = JSON.parse(sessionStorage.getItem('gobuking:demo-accounts:v1')!);
  raw.sessions = raw.sessions.map((s: { id: string; expiresAt: string }) =>
    s.id === session
      ? { ...s, expiresAt: new Date(Date.now() - 1000).toISOString() }
      : s,
  );
  sessionStorage.setItem('gobuking:demo-accounts:v1', JSON.stringify(raw));
  expect(getDemoAccount()).toBeNull();
  expect(() => validateDemoSession(session)).toThrow('kedaluwarsa');
});
