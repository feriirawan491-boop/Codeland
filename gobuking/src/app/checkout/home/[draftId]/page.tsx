import { HomeCheckout } from '@/features/home-rental/components/home-checkout';
import { getI18n } from '@/lib/i18n/server';
import '@/features/hotel/hotel.css';
import '@/features/home-rental/home-rental.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Checkout hunian demo'),
    robots: { index: false, follow: false },
  };
}
export default async function HomeCheckoutPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return <HomeCheckout key={draftId} draftId={draftId} />;
}
