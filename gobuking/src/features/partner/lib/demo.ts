import { guarded, partnerGuard, PartnerError } from './store';
import { createDashboardDemo } from '@/features/dashboard/lib/demo';
import {
  reviewEligibility,
  submitReview,
  simulateReviewModeration,
} from '@/features/dashboard/lib/reviews';
import { sourceReservations } from './sources';
import { bookingAdapter } from '@/features/hotel/lib/booking-adapter';
export async function addPartnerDemoActivities() {
  const ctx = await guarded('team');
  await createDashboardDemo();
  if (partnerGuard('team').sessionKey !== ctx.sessionKey)
    throw new PartnerError('409', 'Konteks berubah. Muat ulang data.');
  const eligible = (await reviewEligibility()).find((v) => v.eligible);
  if (eligible) {
    const review = await submitReview(
      {
        bookingId: eligible.booking.id,
        score: 8,
        title: 'Pelayanan ramah dan kamar nyaman',
        body: 'Tim membantu kebutuhan menginap dengan baik dan kamar terasa nyaman.',
        subscore: 8,
      },
      'partner-review-demo',
    );
    await simulateReviewModeration(review.id, 'publish');
  }
}
export async function simulatePartnerRefund() {
  const ctx = await guarded('team'),
    b = sourceReservations(ctx).find(
      (b) =>
        b.source === 'stay' &&
        b.status === 'confirmed' &&
        b.payment === 'succeeded',
    );
  if (!b)
    throw new PartnerError(
      'VALIDATION',
      'Tidak ada reservasi contoh berbayar untuk simulasi refund.',
    );
  const preview = await bookingAdapter.previewCancellation(b.id);
  await bookingAdapter.requestCancellation(
    b.id,
    preview,
    'Pembatalan pelanggan pada simulasi refund setelah payout',
    crypto.randomUUID(),
  );
}
