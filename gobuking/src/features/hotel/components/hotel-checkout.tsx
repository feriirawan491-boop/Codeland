'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Mail,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { GuestContactFields } from '@/components/booking/guest-contact-fields';
import { PaymentMethodPicker } from '@/components/booking/payment-method-picker';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import {
  bookingAdapter,
  getHotelDraft,
  guestSchema,
  updateHotelDraft,
  type HotelDraft,
} from '../lib/booking-adapter';
import { hotelAdapter } from '../lib/adapter';
import { hotelLink, hotelParams } from '../lib/query';
import type { Hotel, HotelQuote } from '../lib/types';
import {
  DemoNotice,
  ErrorPanel,
  LoadingCards,
  PriceBreakdown,
  StaySummary,
} from './shared';
export function HotelCheckout({ draftId }: { draftId: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [response, setResponse] = useState<{
    draft: HotelDraft;
    hotel: Hotel;
    latest: HotelQuote;
  } | null>(null);
  const [error, setError] = useState('');
  const account = useDemoAccount();
  const [paymentMethod, setPaymentMethod] = useState<'va' | 'qris'>('va');
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const guestForm = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      guestName: '',
      notes: '',
      consent: false,
    },
    shouldFocusError: false,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = guestForm;
  useEffect(() => {
    if (account)
      reset({
        name: account.name,
        email: account.email,
        phone: account.phone,
        guestName: account.name,
        notes: '',
        consent: false,
      });
  }, [account, reset]);
  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const draft = getHotelDraft(draftId);
        if (!draft)
          throw new Error(
            'Pilihan checkout demo tidak ditemukan di tab ini. Pilih kamar kembali.',
          );
        const hotel = hotelAdapter.getHotelById(draft.hotelId);
        if (!hotel)
          throw new Error('Hotel tidak ditemukan atau sedang tidak tersedia.');
        const latest = await hotelAdapter.previewBooking(
          hotel,
          draft.roomId,
          draft.rateId,
          draft.query,
          draft.scenario,
        );
        if (current) setResponse({ draft, hotel, latest });
      } catch (e) {
        if (current)
          setError(
            e instanceof Error
              ? e.message
              : 'Layanan demo sedang terganggu. Coba lagi.',
          );
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [draftId]);
  async function refresh() {
    if (!response) return;
    setRefreshing(true);
    setMutationError('');
    try {
      const draft = await bookingAdapter.refreshQuote(response.draft);
      setResponse({ ...response, draft, latest: draft.quote });
      setAcceptedVersion(draft.quote.version);
    } catch (e) {
      setMutationError(
        e instanceof Error
          ? e.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setRefreshing(false);
    }
  }
  if (!response)
    return (
      <main id="main" className="hotel-module page-container py-12">
        <Link href="/hotels" className="section-link">
          <ArrowLeft size={16} />
          {t('Kembali ke hotel')}
        </Link>
        {error ? <ErrorPanel message={error} /> : <LoadingCards />}
      </main>
    );
  const { draft, hotel, latest } = response;
  const room = hotel.rooms.find((r) => r.id === draft.roomId)!;
  const rate = room.rates.find((r) => r.id === draft.rateId)!;
  const priceChanged =
    latest.version !== (acceptedVersion ?? draft.quote.version);
  const expired = Date.parse(latest.expiresAt) <= now;
  const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(
      async (values) => {
        setMutationError('');
        if (!account) {
          setMutationError('Silakan masuk sebelum membuat pesanan.');
          return;
        }
        if (priceChanged || expired) {
          setMutationError(
            'Periksa dan setujui penawaran terbaru sebelum melanjutkan.',
          );
          return;
        }
        try {
          const booking = await bookingAdapter.createBooking(
            { ...draft, quote: latest },
            acceptedVersion ?? draft.quote.version,
            paymentMethod,
            {
              name: values.name,
              email: values.email,
              guestName: values.guestName,
            },
          );
          await bookingAdapter.command(
            booking.id,
            'start_payment',
            `start:${booking.id}`,
          );
          router.push(`/bookings/${booking.id}`);
        } catch (e) {
          setMutationError(
            e instanceof Error
              ? e.message
              : 'Layanan demo sedang terganggu. Coba lagi.',
          );
        }
      },
      () => requestAnimationFrame(() => errorRef.current?.focus()),
    )(event);
  };
  return (
    <main id="main" className="hotel-module hotel-checkout page-container">
      <Link
        href={hotelLink(hotel.slug, draft.query, draft.scenario)}
        className="section-link"
      >
        <ArrowLeft size={16} />
        {t('Kembali ke pilihan kamar')}
      </Link>
      <DemoNotice />
      <nav className="hotel-steps" aria-label={t('Langkah pemesanan')}>
        {['Pilih kamar', 'Data tamu', 'Pembayaran', 'Konfirmasi'].map(
          (label, i) => (
            <span
              key={label}
              aria-current={i === 1 ? 'step' : undefined}
              className={i === 1 ? 'active' : i === 0 ? 'done' : ''}
            >
              <b>{i === 0 ? <Check size={14} /> : i + 1}</b>
              {t(label)}
            </span>
          ),
        )}
      </nav>
      <div className="checkout-heading">
        <p className="hotel-kicker">{t('TINGGAL SATU LANGKAH LAGI')}</p>
        <h1>{t('Siapkan perjalanan Anda.')}</h1>
        <p>{t('Periksa detail menginap dan isi data yang diperlukan.')}</p>
      </div>
      <div className="hotel-checkout-grid">
        <div className="min-w-0">
          {priceChanged && (
            <div className="quote-change" role="alert">
              <h2>{t('Harga telah berubah')}</h2>
              <p>
                {t('Tinjau total terbaru sebelum menyetujui dan melanjutkan.')}
              </p>
              <div>
                <del>{formatRupiah(draft.quote.total, locale)}</del>
                <ArrowRight size={17} />
                <strong>{formatRupiah(latest.total, locale)}</strong>
              </div>
              <Button
                onClick={() => {
                  setAcceptedVersion(latest.version);
                  const updated = { ...draft, quote: latest };
                  updateHotelDraft(updated);
                  setResponse({ ...response, draft: updated });
                }}
              >
                {t('Setujui harga terbaru')}
              </Button>
            </div>
          )}
          {expired && (
            <div className="quote-change" role="alert">
              <h2>{t('Penawaran kedaluwarsa')}</h2>
              <p>{t('Perbarui harga dan ketersediaan sebelum melanjutkan.')}</p>
              <Button disabled={refreshing} onClick={refresh}>
                {refreshing && <LoaderCircle className="animate-spin" />}
                {t('Perbarui penawaran')}
              </Button>
            </div>
          )}
          {!account ? (
            <div className="hotel-account-gate">
              <AccountAccess />
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="hotel-guest-form">
              <div className="hotel-authenticated">
                <ShieldCheck size={19} />
                {t('Sesi pelanggan demo aktif')}
              </div>
              <h2>{t('Data pemesan')}</h2>
              <p>
                {t('Nama pemesan dapat berbeda dari tamu yang akan menginap.')}
              </p>
              {Object.keys(errors).length > 0 && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  className="hotel-action-error"
                  role="alert"
                >
                  <Info size={18} />
                  <div>
                    <strong>{t('Periksa kembali data tamu')}</strong>
                    <ul>
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>
                          <a href={`#guest-${key}`}>{t(error?.message)}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <GuestContactFields form={guestForm} />
              <div className="hotel-policy-box">
                <h3>{t('Kebijakan pembatalan')}</h3>
                <p>
                  {t(
                    latest.freeCancellation
                      ? 'Contoh tarif fleksibel: pembatalan sebelum layanan dimulai mendapat estimasi refund penuh. Kebijakan produksi mengikuti snapshot mitra.'
                      : 'Contoh tarif non-refundable: pembatalan dapat dilakukan tanpa pengembalian biaya menginap.',
                  )}
                </p>
                <h3>{t('Mode konfirmasi')}</h3>
                <p>
                  {t(
                    'Konfirmasi memerlukan alokasi kamar dan hasil pembayaran demo yang berhasil.',
                  )}
                </p>
              </div>
              <fieldset className="checkout-payment-options">
                <legend>{t('Pilih metode pembayaran')}</legend>
                <p>
                  {t(
                    'Langsung lanjut ke pembayaran tanpa menunggu persetujuan mitra.',
                  )}
                </p>
                <PaymentMethodPicker
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={isSubmitting}
                />
              </fieldset>
              <label className="hotel-consent" htmlFor="guest-consent">
                <input
                  id="guest-consent"
                  type="checkbox"
                  {...register('consent')}
                  aria-invalid={!!errors.consent}
                />
                <span>
                  {t(
                    'Saya memahami ketentuan tarif, kebijakan pembatalan, serta bahwa ini adalah simulasi tanpa transaksi nyata.',
                  )}
                </span>
              </label>
              {errors.consent && (
                <p className="field-error">{t(errors.consent.message)}</p>
              )}
              {mutationError && (
                <div role="alert" className="hotel-action-error">
                  <Info size={18} />
                  <p>{t(mutationError)}</p>
                </div>
              )}
              <Button
                type="submit"
                className="mt-5 w-full"
                disabled={isSubmitting || priceChanged || expired}
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {t(
                  isSubmitting
                    ? 'Memproses simulasi…'
                    : 'Lanjut ke pembayaran demo',
                )}
              </Button>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {t(
                  'Data pemesan disimpan di tab ini untuk invoice dan simulasi email. Tidak ada transaksi atau email sungguhan.',
                )}
              </p>
            </form>
          )}
        </div>
        <aside className="hotel-order-summary">
          <div className="order-summary-image">
            <Image
              src={`/images/${hotel.images[0]}.jpg`}
              alt={t('Ilustrasi {0}', { '0': hotel.name })}
              fill
              sizes="400px"
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h2>{hotel.name}</h2>
            <p>
              {t(room.name)} · {t(rate.label)}
            </p>
            <StaySummary query={draft.query} />
            <PriceBreakdown quote={latest} />
            <p className="hotel-inline-note">
              <Mail size={16} />
              {t(
                'Invoice booking/reservasi tersedia setelah pembayaran berhasil. Pengiriman email pada versi lokal masih simulasi.',
              )}
            </p>
          </div>
        </aside>
      </div>
      <Link
        href={`/hotels?${hotelParams(draft.query)}`}
        className="section-link my-8"
      >
        {t('Kembali ke hasil')}
      </Link>
    </main>
  );
}
