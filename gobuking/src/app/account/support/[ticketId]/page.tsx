import { Suspense } from 'react';
import { UserDashboard } from '@/features/dashboard/components/dashboard';
import '@/features/dashboard/dashboard.css';
export const metadata = {
  title: 'Tiket bantuan',
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return (
    <Suspense>
      <UserDashboard section="support" ticketId={ticketId} />
    </Suspense>
  );
}
