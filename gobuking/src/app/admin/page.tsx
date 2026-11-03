import { Suspense } from 'react';
import { AdminDashboard } from '@/features/admin/components/admin-dashboard';
export const metadata = {
  title: 'Super Admin',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense>
      <AdminDashboard section="overview" />
    </Suspense>
  );
}
