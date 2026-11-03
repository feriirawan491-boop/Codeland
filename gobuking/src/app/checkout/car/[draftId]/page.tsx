import { Suspense } from 'react';
import { CarCheckout } from '@/features/car/components/car-checkout';
import { getI18n } from '@/lib/i18n/server';
import '@/features/car/car.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Pengajuan rental mobil'),
    robots: { index: false, follow: false },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <CarCheckout draftId={draftId} />
    </Suspense>
  );
}
