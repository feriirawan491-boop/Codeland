import { Suspense } from 'react';
import { MiceResults } from '@/features/mice/components/mice-results';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Cari ruang meeting & acara'),
    robots: { index: false, follow: false },
  };
}
export default function MicePage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <MiceResults />
    </Suspense>
  );
}
