import { Suspense } from 'react';
import { WeddingResults } from '@/features/wedding/components/wedding-results';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
import '@/features/wedding/wedding.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Cari Wedding Venue'),
    robots: { index: false, follow: false },
  };
}
export default function WeddingPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <WeddingResults />
    </Suspense>
  );
}
