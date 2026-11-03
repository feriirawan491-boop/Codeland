import { Suspense } from 'react';
import { CarResults } from '@/features/car/components/car-results';
import { getI18n } from '@/lib/i18n/server';
import '@/features/car/car.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Hasil rental mobil'),
    robots: { index: false, follow: false },
  };
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <CarResults results />
    </Suspense>
  );
}
