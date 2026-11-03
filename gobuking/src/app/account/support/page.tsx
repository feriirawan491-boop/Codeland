import { Suspense } from 'react';
import { UserDashboard } from '@/features/dashboard/components/dashboard';
import '@/features/dashboard/dashboard.css';
export const metadata = {
  title: 'Dashboard akun',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense>
      <UserDashboard section="support" />
    </Suspense>
  );
}
