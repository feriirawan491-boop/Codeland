import { Suspense } from 'react';
import { HomeDetail } from '@/features/home-rental/components/home-detail';
import { getI18n } from '@/lib/i18n/server';
import '@/features/hotel/hotel.css';
import '@/features/home-rental/home-rental.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Detail hunian'), robots: { index: false, follow: false } };
}
export default async function HomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <HomeDetail key={slug} slug={slug} />
    </Suspense>
  );
}
