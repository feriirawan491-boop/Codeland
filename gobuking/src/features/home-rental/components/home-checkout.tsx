'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  LoaderCircle,
  ShieldCheck,
  House,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import {
  GuestContactFields,
  type GuestValues,
} from '@/components/booking/guest-contact-fields';
import { PaymentMethodPicker } from '@/components/booking/payment-method-picker';
import { Button } from '@/components/ui/button';
import {
  bookingAdapter,
  guestSchema,
} from '@/features/hotel/lib/booking-adapter';
import {
  ErrorPanel,
  LoadingCards,
  PriceBreakdown,
  StaySummary,
} from '@/features/hotel/components/shared';
import { formatRupiah } from '@/lib/utils';
import { homeAdapter, readHomeDraft, updateHomeDraft } from '../lib/adapter';
import { homeLink } from '../lib/query';
import type { HomeDraft, HomeProperty, HomeQuote } from '../lib/types';
import { HomeDemoNotice, HomeRules, DepositNotice } from './shared';
export function HomeCheckout({ draftId }: { draftId: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const account = useDemoAccount();
  const [response, setResponse] = useState<{
    draft: HomeDraft;
    home: HomeProperty;
    latest: HomeQuote;
  } | null>(null);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [method, setMethod] = useState<'va' | 'qris'>('va');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesError, setRulesError] = useState(false);
  const [now, setNow] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const form = useForm<GuestValues>({
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
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
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
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const existing = bookingAdapter.findOwnDraftBooking(draftId);
        if (existing) {
          router.replace(`/bookings/${existing.id}`);
          return;
        }
        const draft = readHomeDraft(draftId);
        if (!draft)
          throw new Error(
            'Pilihan hunian tidak ditemukan di tab ini. Pilih hunian kembali.',
          );
        const home = homeAdapter.getHomeById(draft.homeId);
        if (!home) throw new Error('Hunian tidak aktif atau tidak tersedia.');
        const latest = await homeAdapter.previewHomeQuote(
          home,
          draft.query,
          draft.extraIds,
          draft.scenario,
        );
        if (active) setResponse({ draft, home, latest });
      } catch (error) {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : 'Layanan demo sedang terganggu. Coba lagi.',
          );
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [draftId, router, account?.id]);
  async function refresh() {
    if (!response) return;
    setRefreshing(true);
    setMutationError('');
    try {
      const draft = await homeAdapter.refreshQuote(response.draft);
      setResponse({ ...response, draft, latest: draft.quote });
      setAcceptedVersion(draft.quote.version);
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setRefreshing(false);
    }
  }
  if (!response)
    return (
      <main id="main" className="hotel-module home-module page-container py-12">
        <Link href="/homes" className="section-link">
          <ArrowLeft />
          {t('Kembali ke hunian')}
        </Link>
        {error ? (
          <ErrorPanel message={error} />
        ) : (
          <LoadingCards label="Memuat hunian" />
        )}
      </main>
    );
  const { draft, home, latest } = response;
  const changed = latest.version !== (acceptedVersion ?? draft.quote.version);
  const expired = Date.parse(latest.expiresAt) <= now;
  const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(
      async (values) => {
        setMutationError('');
        setRulesError(!rulesAccepted);
        if (!account) {
          setMutationError('Silakan masuk sebelum membuat pesanan.');
          return;
        }
        if (!rulesAccepted) {
          setMutationError(
            'Setujui aturan rumah dan ketentuan deposit sebelum melanjutkan.',
          );
          requestAnimationFrame(() => errorRef.current?.focus());
          return;
        }
        if (changed || expired) {
          setMutationError(
            'Periksa dan setujui penawaran terbaru sebelum melanjutkan.',
          );
          return;
        }
        try {
          const booking = await bookingAdapter.createHomeBooking(
            { ...draft, quote: latest },
            acceptedVersion ?? draft.quote.version,
            method,
            {
              name: values.name,
              email: values.email,
              guestName: values.guestName,
            },
            rulesAccepted,
          );
          await bookingAdapter.command(
            booking.id,
            'start_payment',
            `start:${booking.id}`,
          );
          router.push(`/bookings/${booking.id}`);
        } catch (error) {
          setMutationError(
            error instanceof Error
              ? error.message
              : 'Layanan demo sedang terganggu. Coba lagi.',
          );
        }
      },
      () => requestAnimationFrame(() => errorRef.current?.focus()),
    )(event);
  };
  return (
    <main
      id="main"
      className="hotel-module home-module hotel-checkout page-container"
    >
      <Link
        className="section-link"
        href={homeLink(home.slug, draft.query, draft.scenario)}
      >
        <ArrowLeft />
        {t('Kembali ke pilihan hunian')}
      </Link>
      <HomeDemoNotice />
      <nav className="hotel-steps" aria-label={t('Langkah pemesanan')}>
        {['Pilih hunian', 'Data tamu', 'Pembayaran', 'Konfirmasi'].map(
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
        <p className="hotel-kicker">{t('SATU HUNIAN UNTUK CERITA ANDA')}</p>
        <h1>{t('Siapkan waktu bersama.')}</h1>
        <p>
          {t('Periksa aturan rumah, data tamu, dan rincian sebelum membayar.')}
        </p>
      </div>
      <div className="hotel-checkout-grid">
        <div className="min-w-0">
          {changed && (
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
                  const next = { ...draft, quote: latest };
                  updateHomeDraft(next);
                  setResponse({ ...response, draft: next });
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
            <form className="hotel-guest-form" noValidate onSubmit={submit}>
              <div className="hotel-authenticated">
                <ShieldCheck size={19} />
                {t('Sesi pelanggan demo aktif')}
              </div>
              <h2>{t('Data pemesan')}</h2>
              <p>
                {t('Nama pemesan dapat berbeda dari tamu yang akan menginap.')}
              </p>
              {(Object.keys(errors).length > 0 ||
                rulesError ||
                mutationError) && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  className="hotel-action-error"
                  role="alert"
                >
                  <Info size={18} />
                  <div>
                    <strong>{t('Periksa kembali data pemesanan')}</strong>
                    <ul>
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>
                          <a href={`#guest-${field}`}>{t(error?.message)}</a>
                        </li>
                      ))}
                      {rulesError && (
                        <li>
                          <a href="#home-rules-consent">
                            {t(
                              'Setujui aturan rumah dan ketentuan deposit sebelum melanjutkan.',
                            )}
                          </a>
                        </li>
                      )}
                      {mutationError && <li>{t(mutationError)}</li>}
                    </ul>
                  </div>
                </div>
              )}
              <GuestContactFields form={form} />
              <div className="home-checkout-rules">
                <h3>
                  <House size={20} />
                  {t('Aturan rumah & ketentuan deposit')}
                </h3>
                <HomeRules home={home} compact />
                <DepositNotice deposit={home.deposit} />
                <label className="hotel-consent" htmlFor="home-rules-consent">
                  <input
                    id="home-rules-consent"
                    type="checkbox"
                    checked={rulesAccepted}
                    aria-invalid={rulesError}
                    onChange={(e) => {
                      setRulesAccepted(e.target.checked);
                      if (e.target.checked) setRulesError(false);
                    }}
                  />
                  <span>
                    {t(
                      'Saya menyetujui aturan rumah dan memahami deposit dibayar terpisah kepada pengelola.',
                    )}
                  </span>
                </label>
              </div>
              <div className="hotel-policy-box">
                <h3>{t('Kebijakan pembatalan')}</h3>
                <p>
                  {t(
                    latest.freeCancellation
                      ? 'Tarif fleksibel demo · estimasi refund penuh sebelum layanan.'
                      : 'Tarif non-refundable demo · tanpa refund biaya menginap.',
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
                  value={method}
                  onChange={setMethod}
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
              <Button
                type="submit"
                className="mt-5 w-full"
                disabled={isSubmitting || changed || expired}
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
              src={`/images/${home.images[0]}.jpg`}
              alt={t('Ilustrasi {0}', { '0': home.name })}
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <div className="p-6">
            <span className="home-detail-badge">
              <House size={15} />
              {t('Seluruh hunian')}
            </span>
            <h2>{home.name}</h2>
            <StaySummary query={draft.query} kind="home" />
            <PriceBreakdown quote={latest} />
            <DepositNotice deposit={home.deposit} />
            <p className="hotel-inline-note">
              <Info size={17} />
              {t(
                'Invoice booking/reservasi tersedia setelah pembayaran berhasil. Pengiriman email pada versi lokal masih simulasi.',
              )}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
