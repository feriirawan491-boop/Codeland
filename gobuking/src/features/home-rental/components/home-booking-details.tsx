'use client';
import { useEffect, useState } from 'react';
import { Info, MapPin, KeyRound } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { bookingAdapter } from '@/features/hotel/lib/booking-adapter';
import type { DemoBooking } from '@/features/hotel/lib/types';
import { HomeRules, DepositNotice } from './shared';
export function HomeBookingDetails({ booking }: { booking: DemoBooking }) {
  const { t } = useI18n();
  const [response, setResponse] = useState<{
    key: string;
    data?: Awaited<
      ReturnType<typeof bookingAdapter.getHomeArrivalInstructions>
    >;
    error?: string;
  }>();
  const key = `${booking.id}:${booking.bookingStatus}`;
  useEffect(() => {
    if (!booking.home || booking.bookingStatus !== 'confirmed') return;
    let active = true;
    bookingAdapter
      .getHomeArrivalInstructions(booking.id)
      .then((data) => {
        if (active) setResponse({ key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResponse({
            key,
            error:
              error instanceof Error
                ? error.message
                : 'Layanan demo sedang terganggu. Coba lagi.',
          });
      });
    return () => {
      active = false;
    };
  }, [booking.id, booking.bookingStatus, booking.home, key]);
  if (!booking.home) return null;
  return (
    <section className="home-booking-details">
      <h2>{t('Aturan hunian pada reservasi ini')}</h2>
      <HomeRules home={booking.home} compact />
      <DepositNotice deposit={booking.home.deposit} />
      {booking.bookingStatus === 'confirmed' ? (
        <div className="home-arrival">
          <KeyRound size={24} />
          <h3>{t('Instruksi kedatangan')}</h3>
          {response?.key !== key ? (
            <p>{t('Memuat instruksi kedatangan…')}</p>
          ) : response.error ? (
            <p role="alert">{t(response.error)}</p>
          ) : (
            <>
              <p>
                <MapPin size={16} />
                {response.data?.area} · {t('Titik temu demo')}
              </p>
              <p>
                {t('Pengelola')}: {response.data?.hostName} · {t('Check-in')}{' '}
                {response.data?.checkIn} ({response.data?.zone})
              </p>
              <ol>
                {response.data?.steps.map((step) => (
                  <li key={step}>{t(step)}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : (
        <p className="hotel-inline-note">
          <Info size={17} />
          {t('Instruksi kedatangan tersedia setelah reservasi terkonfirmasi.')}
        </p>
      )}
    </section>
  );
}
