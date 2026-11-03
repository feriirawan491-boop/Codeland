import { Suspense } from 'react';
import { InquiryTracking } from '@/features/mice/components/inquiry-tracking';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
import '@/features/wedding/wedding.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Inquiry & penawaran venue'),
    robots: { index: false, follow: false },
  };
}
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <main id="main" className="page-container py-16">
          <div className="skeleton h-80 rounded-2xl" />
        </main>
      }
    >
      <InquiryTracking key={id} id={id} />
    </Suspense>
  );
}
