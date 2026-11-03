import { Suspense } from 'react';
import { CarDetail } from '@/features/car/components/car-detail';
import { getI18n } from '@/lib/i18n/server';
import '@/features/car/car.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Detail paket rental mobil'),
    robots: { index: false, follow: false },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <CarDetail offerId={offerId} />
    </Suspense>
  );
}
