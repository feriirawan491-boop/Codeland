import { Suspense } from 'react';
import { getI18n } from '@/lib/i18n/server';
import { HotelResults } from '@/features/hotel/components/hotel-results';
import '@/features/hotel/hotel.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Cari hotel'), robots: { index: false, follow: false } };
}
export default function HotelsPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <HotelResults />
    </Suspense>
  );
}
