import { Suspense } from 'react';
import { FlightEntry } from '@/features/flights/components/flight-entry';
import { getI18n } from '@/lib/i18n/server';
import '@/features/flights/flights.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Cari penerbangan'),
    robots: { index: false, follow: false },
  };
}
export default function FlightsPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <FlightEntry />
    </Suspense>
  );
}
