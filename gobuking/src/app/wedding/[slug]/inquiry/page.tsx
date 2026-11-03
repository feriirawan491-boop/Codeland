import { Suspense } from 'react';
import { WeddingInquiry } from '@/features/wedding/components/wedding-inquiry';
import { getI18n } from '@/lib/i18n/server';
import '@/features/mice/mice.css';
import '@/features/wedding/wedding.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Inquiry Wedding Venue'),
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
      <WeddingInquiry key={slug} slug={slug} />
    </Suspense>
  );
}
