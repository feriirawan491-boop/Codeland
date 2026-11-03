import { Suspense } from 'react';
import { EventInquiryForm } from '@/features/mice/components/event-inquiry-form';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Inquiry kebutuhan acara'),
    robots: { index: false, follow: false },
  };
}
export default async function InquiryPage({
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
      <EventInquiryForm key={slug} slug={slug} />
    </Suspense>
  );
}
