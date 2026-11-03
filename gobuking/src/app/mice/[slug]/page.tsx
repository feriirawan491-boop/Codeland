import { Suspense } from 'react';
import { SpaceDetail } from '@/features/mice/components/space-detail';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Detail ruang MICE'),
    robots: { index: false, follow: false },
  };
}
export default async function SpacePage({
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
      <SpaceDetail key={slug} slug={slug} />
    </Suspense>
  );
}
