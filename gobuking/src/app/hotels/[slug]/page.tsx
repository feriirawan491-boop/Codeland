import { Suspense } from 'react';
import { HotelDetail } from '@/features/hotel/components/hotel-detail';
import '@/features/hotel/hotel.css';
export const metadata = {
  title: 'Hotel · Gobuking',
  robots: { index: false, follow: false },
};
export default async function HotelPage({
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
      <HotelDetail key={slug} slug={slug} />
    </Suspense>
  );
}
