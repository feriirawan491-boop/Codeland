import { Suspense } from 'react';
import { FlightResults } from '@/features/flights/components/flight-results';
import { getI18n } from '@/lib/i18n/server';
import '@/features/flights/flights.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Hasil penerbangan'),
    robots: { index: false, follow: false },
  };
}
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <FlightResults />
    </Suspense>
  );
}
