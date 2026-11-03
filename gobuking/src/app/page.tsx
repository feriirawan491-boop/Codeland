import { getI18n } from '@/lib/i18n/server';
import { Suspense } from 'react';
import { SearchPanel } from '@/features/home/components/search-panel';
import { HomeContent } from '@/features/home/components/home-content';
import { Deals } from '@/features/home/components/deals';
import { TrustSection } from '@/features/home/components/trust-section';
export default async function HomePage() {
  const { t } = await getI18n();
  return (
    <main id="main">
      <Suspense
        fallback={
          <div className="page-container skeleton my-5 h-48 rounded-xl" />
        }
      >
        <SearchPanel />
      </Suspense>
      <div className="page-container search-reassurance">
        <span>{t('\u2713 Pilihan untuk setiap perjalanan')}</span>
        <span className="hidden text-border sm:block">/</span>
        <span>{t('\u2713 Bebas jelajahi tanpa login')}</span>
        <span className="hidden text-border sm:block">/</span>
        <span>{t('\u2713 Informasi harga yang jelas')}</span>
      </div>
      <Deals />
      <Suspense
        fallback={<div className="page-container skeleton h-60 rounded-xl" />}
      >
        <HomeContent />
      </Suspense>
      <TrustSection />
    </main>
  );
}
