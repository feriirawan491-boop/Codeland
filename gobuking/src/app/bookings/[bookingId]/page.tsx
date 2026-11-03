import { Suspense } from 'react';
import { CarBooking } from '@/features/car/components/car-booking';
import '@/features/car/car.css';
import { BookingStatusPage } from '@/features/hotel/components/booking-status';
import { getI18n } from '@/lib/i18n/server';
import '@/features/hotel/hotel.css';
import '@/features/home-rental/home-rental.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Status pesanan demo'),
    robots: { index: false, follow: false },
  };
}
export default async function BookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return bookingId.startsWith('CAR-DEMO-') ? (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <CarBooking key={bookingId} bookingId={bookingId} />
    </Suspense>
  ) : (
    <BookingStatusPage key={bookingId} bookingId={bookingId} />
  );
}
