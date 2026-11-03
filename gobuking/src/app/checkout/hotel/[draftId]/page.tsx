import { HotelCheckout } from '@/features/hotel/components/hotel-checkout';
import { getI18n } from '@/lib/i18n/server';
import '@/features/hotel/hotel.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t('Checkout hotel demo'),
    robots: { index: false, follow: false },
  };
}
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return <HotelCheckout key={draftId} draftId={draftId} />;
}
