import { Suspense } from 'react';
import { PartnerDashboard } from '@/features/partner/components/partner-dashboard';
import '@/features/partner/partner.css';
export const metadata = {
  title: 'Partner Dashboard',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense>
      <PartnerDashboard section="operations" />
    </Suspense>
  );
}
