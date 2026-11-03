import { getAllMyBookings, getMyBooking, bookingRow } from './bookings';
import {
  readDashboardStore,
  saveDashboardRecord,
  requireDashboardAccount,
  assertSameAccount,
  dashboardDelay,
  DashboardError,
} from './store';
import { reviewSchema } from './query';
import type { AccountReview, ReviewEligibility } from './types';
const KEY = 'gobuking:account-reviews:v1';
export async function listMyReviews() {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  return Object.values(readDashboardStore<AccountReview>(KEY)).filter(
    (item) => item.accountId === account.id,
  );
}
export async function reviewEligibility(): Promise<ReviewEligibility[]> {
  const account = requireDashboardAccount(),
    [bookings, reviews] = await Promise.all([
      getAllMyBookings(),
      listMyReviews(),
    ]);
  assertSameAccount(account.id);
  return bookings
    .filter((b) => b.status === 'completed')
    .map((booking) => {
      const time = booking.completedAt ? Date.parse(booking.completedAt) : NaN;
      const expiresAt = Number.isFinite(time)
        ? new Date(time + 90 * 86400000).toISOString()
        : null;
      const reason = reviews.some((r) => r.bookingId === booking.id)
        ? 'Ulasan untuk transaksi ini sudah dikirim.'
        : !expiresAt
          ? 'Waktu selesai layanan belum tersedia. Hubungi CS.'
          : time > Date.now()
            ? 'Layanan belum selesai sesuai waktu transaksi.'
            : Date.now() > Date.parse(expiresAt)
              ? 'Jendela ulasan demo 90 hari sudah berakhir.'
              : null;
      return { booking, eligible: !reason, reason, expiresAt };
    });
}
export async function submitReview(
  input: Parameters<typeof reviewSchema.parse>[0],
  commandId: string,
) {
  const account = requireDashboardAccount(),
    valid = reviewSchema.parse(input);
  await dashboardDelay();
  assertSameAccount(account.id);
  await getMyBooking(valid.bookingId);
  assertSameAccount(account.id);
  const existing = Object.values(readDashboardStore<AccountReview>(KEY)).find(
    (item) =>
      item.accountId === account.id &&
      (item.commandId === commandId || item.bookingId === valid.bookingId),
  );
  if (existing) return existing;
  const eligible = (await reviewEligibility()).find(
    (item) => item.booking.id === valid.bookingId,
  );
  assertSameAccount(account.id);
  if (!eligible?.eligible)
    throw new DashboardError(
      'ELIGIBILITY',
      eligible?.reason ?? 'Ulasan hanya untuk layanan yang sudah selesai.',
    );
  const concurrent = Object.values(readDashboardStore<AccountReview>(KEY)).find(
    (item) =>
      item.accountId === account.id && item.bookingId === valid.bookingId,
  );
  if (concurrent) return concurrent;
  const value: AccountReview = {
    ...valid,
    id: `REVIEW-${crypto.randomUUID()}`,
    accountId: account.id,
    status: 'pending',
    reply: null,
    reason: null,
    createdAt: new Date().toISOString(),
    commandId,
  };
  return saveDashboardRecord(KEY, value.id, value);
}
export async function simulateReviewModeration(
  id: string,
  action: 'publish' | 'reply' | 'reject',
) {
  const account = requireDashboardAccount();
  await dashboardDelay();
  assertSameAccount(account.id);
  const value = readDashboardStore<AccountReview>(KEY)[id];
  if (!value || value.accountId !== account.id)
    throw new DashboardError('403', 'Ulasan ini tidak dapat diakses.');
  const next = { ...value };
  if (action === 'publish') next.status = 'published';
  if (action === 'reject') {
    next.status = 'rejected';
    next.reason =
      'Perbaiki informasi pribadi pada isi ulasan sebelum ditinjau kembali.';
  }
  if (action === 'reply')
    next.reply =
      'Terima kasih atas ulasan Anda. Masukan ini telah dicatat oleh mitra demo.';
  return saveDashboardRecord(KEY, id, next);
}
export async function getReviewContext(id: string) {
  return bookingRow(await getMyBooking(id));
}
