import { Suspense } from 'react';
import { HomeResults } from '@/features/home-rental/components/home-results';
import { getI18n } from '@/lib/i18n/server';
import '@/features/hotel/hotel.css';
import '@/features/home-rental/home-rental.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Cari hunian'), robots: { index: false, follow: false } };
}
export default function HomesPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <HomeResults />
    </Suspense>
  );
}
