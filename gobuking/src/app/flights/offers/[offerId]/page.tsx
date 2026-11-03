import { Suspense } from 'react';
import { FlightDetail } from '@/features/flights/components/flight-detail';
import { getI18n } from '@/lib/i18n/server';
import '@/features/flights/flights.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Detail itinerary penerbangan'),
    robots: { index: false, follow: false },
  };
}
export default async function OfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <FlightDetail offerId={offerId} />
    </Suspense>
  );
}
