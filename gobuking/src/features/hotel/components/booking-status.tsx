'use client';
import { CancellationPanel } from '@/features/dashboard/components/cancellation-panel';
import '@/features/dashboard/dashboard.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Info,
  LoaderCircle,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/utils';
import { bookingAdapter } from '../lib/booking-adapter';
import { bookingPresentation } from '@/features/booking/lib/presentation';
import { HomeBookingDetails } from '@/features/home-rental/components/home-booking-details';
import {
  BOOKING_LABELS,
  PAYMENT_LABELS,
  REFUND_LABELS,
} from '../lib/booking-labels';
import { canDownloadBookingInvoice, invoiceFilename } from '../lib/invoice';
import { BookingInvoicePanel } from './booking-invoice-panel';
import { hotelParams } from '../lib/query';
import { homeParams } from '@/features/home-rental/lib/query';
import type { BookingCommand, DemoBooking } from '../lib/types';
import {
  DemoNotice,
  ErrorPanel,
  LoadingCards,
  PriceBreakdown,
  StaySummary,
} from './shared';
export function BookingStatusPage({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n();
  const account = useDemoAccount();
  const [storedBooking, setBooking] = useState<DemoBooking | null>(null);
  const booking =
    storedBooking?.customerId === account?.id ? storedBooking : null;
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!account) return;
    let active = true;
    bookingAdapter
      .getBooking(bookingId)
      .then((value) => {
        if (active) setBooking(value);
      })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : 'Layanan demo sedang terganggu. Coba lagi.',
          );
      });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [bookingId, account]);
  async function command(action: BookingCommand) {
    setBusy(true);
    setActionError('');
    try {
      const value = await bookingAdapter.command(
        bookingId,
        action,
        crypto.randomUUID(),
      );
      setBooking(value);
      setCancelOpen(false);
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    setActionError('');
    try {
      setBooking(await bookingAdapter.getBooking(bookingId));
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (!account)
    return (
      <main id="main" className="hotel-module page-container py-12">
        <h1 className="sr-only">{t('Masuk untuk melihat pesanan')}</h1>
        <div className="hotel-account-gate mx-auto max-w-lg">
          <AccountAccess />
        </div>
      </main>
    );
  if (!booking)
    return (
      <main id="main" className="hotel-module page-container py-12">
        <Link href="/hotels" className="section-link">
          <ArrowLeft size={16} />
          {t('Kembali ke hotel')}
        </Link>
        {error ? <ErrorPanel message={error} /> : <LoadingCards />}
      </main>
    );
  const property = bookingPresentation(booking);
  const remaining = Math.max(
    0,
    Math.floor((Date.parse(booking.expiresAt) - now) / 1000),
  );
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  const canInvoice = canDownloadBookingInvoice(booking);
  const canCancel = ['awaiting_payment', 'confirmed'].includes(
    booking.bookingStatus,
  );
  async function downloadInvoice() {
    if (downloading) return;
    setDownloading(true);
    setActionError('');
    try {
      const current = await bookingAdapter.getBooking(bookingId);
      if (!property || !canDownloadBookingInvoice(current))
        throw new Error(
          'Invoice tersedia setelah pembayaran berhasil dan reservasi terkonfirmasi.',
        );
      setBooking(current);
      const { createBookingInvoicePdf } = await import('../lib/invoice-pdf');
      const bytes = await createBookingInvoicePdf(current, property, locale, t);
      const url = URL.createObjectURL(
        new Blob([bytes], { type: 'application/pdf' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = invoiceFilename(current);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Invoice belum dapat diunduh. Silakan coba lagi.',
      );
    } finally {
      setDownloading(false);
    }
  }
  return (
    <main id="main" className="hotel-module hotel-booking page-container">
      <nav className="hotel-breadcrumb" aria-label={t('Breadcrumb')}>
        <Link href="/">{t('Beranda')}</Link>
        <span>/</span>
        <Link href={property?.path ?? '/hotels'}>
          {t(property?.categoryLabel ?? 'Hotel')}
        </Link>
        <span>/</span>
        <span>{t('Status pesanan')}</span>
      </nav>
      <DemoNotice />
      <Link
        href="/account/bookings"
        className="inline-flex my-4 text-blue-700 font-semibold text-sm"
      >
        ← {t('Kembali ke dashboard akun')}
      </Link>
      <div className={`booking-status-banner status-${booking.bookingStatus}`}>
        <div className="booking-status-icon">
          {['confirmed', 'completed'].includes(booking.bookingStatus) ? (
            <CheckCircle2 size={32} />
          ) : (
            <Clock size={32} />
          )}
        </div>
        <div>
          <p>
            {t('NOMOR PESANAN DEMO')} · {booking.id}
          </p>
          <h1>{t(BOOKING_LABELS[booking.bookingStatus])}</h1>
          <span>
            {t(
              canInvoice
                ? 'Invoice reservasi tersedia untuk diunduh. Pengiriman email di versi lokal masih simulasi.'
                : booking.bookingStatus === 'exception'
                  ? 'Pembayaran diterima dalam simulasi, namun reservasi belum dapat dikonfirmasi. Hubungi bantuan demo.'
                  : 'Ikuti status pemesanan dan pembayaran secara terpisah di bawah ini.',
            )}
          </span>
        </div>
      </div>
      <div className="booking-domain-statuses">
        <div>
          <small>{t('Status reservasi')}</small>
          <strong>{t(BOOKING_LABELS[booking.bookingStatus])}</strong>
        </div>
        <div>
          <small>{t('Status pembayaran')}</small>
          <strong>{t(PAYMENT_LABELS[booking.paymentStatus])}</strong>
        </div>
        <div>
          <small>{t('Status refund')}</small>
          <strong>{t(REFUND_LABELS[booking.refundStatus])}</strong>
        </div>
      </div>
      <div className="hotel-checkout-grid">
        <div className="min-w-0">
          {['awaiting_payment'].includes(booking.bookingStatus) && (
            <div className="booking-deadline">
              <Clock size={19} />
              <div>
                <strong>{t('Sisa waktu pembayaran demo')}</strong>
                <p>
                  {remaining > 0
                    ? `${minutes}:${seconds}`
                    : t('Batas waktu terlewati. Periksa status pesanan.')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={refresh}
              >
                <RefreshCw />
                {t('Periksa status')}
              </Button>
            </div>
          )}
          {booking.bookingStatus === 'awaiting_payment' && (
            <section className="hotel-payment-panel">
              <h2>{t('Pembayaran demo')}</h2>
              <p>
                {t(
                  'Metode pembayaran Anda sudah dipilih saat checkout. Ini bukan tagihan sungguhan.',
                )}
              </p>
              <div className="checkout-payment-choice">
                {booking.paymentMethod === 'qris' ? (
                  <QrCode size={21} />
                ) : (
                  <CreditCard size={21} />
                )}{' '}
                {t(
                  booking.paymentMethod === 'qris'
                    ? 'QRIS demo'
                    : 'Virtual Account demo',
                )}
              </div>
              {booking.paymentStatus !== 'pending' ? (
                <Button
                  className="mt-5 w-full"
                  disabled={busy || !remaining}
                  onClick={() => command('start_payment')}
                >
                  {busy ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {t(
                    booking.paymentStatus === 'failed'
                      ? 'Coba pembayaran demo lagi'
                      : 'Buka instruksi pembayaran demo',
                  )}
                </Button>
              ) : (
                <div className="demo-invoice">
                  <Info size={23} />
                  <h3>{t('SIMULASI — JANGAN TRANSFER UANG')}</h3>
                  <p>
                    {t(
                      booking.paymentMethod === 'va'
                        ? 'Nomor referensi ini bukan rekening bank.'
                        : 'Kode QR pembayaran nyata tidak dibuat dalam demo ini.',
                    )}
                  </p>
                  <code>
                    {booking.paymentMethod === 'va'
                      ? `DEMO-VA-${booking.id}`
                      : 'DEMO-QRIS — NO PAYMENT CODE'}
                  </code>
                  <strong>{formatRupiah(booking.quote.total, locale)}</strong>
                  <p>
                    {t(
                      'Status tetap menunggu sampai hasil gateway disimulasikan melalui alat demo.',
                    )}
                  </p>
                </div>
              )}
            </section>
          )}
          {canInvoice && (
            <BookingInvoicePanel
              booking={booking}
              downloading={downloading}
              busy={busy}
              onDownload={() => void downloadInvoice()}
              onResend={() => void command('resend_invoice')}
            />
          )}
          {booking.bookingStatus === 'exception' && (
            <div className="hotel-action-error" role="alert">
              <Info size={21} />
              <p>
                {t(
                  'Invoice reservasi belum diterbitkan karena reservasi belum terkonfirmasi. Pembayaran ini memerlukan penanganan.',
                )}
              </p>
            </div>
          )}
          {actionError && (
            <div className="hotel-action-error" role="alert">
              <Info size={18} />
              <p>{t(actionError)}</p>
            </div>
          )}
          {booking.home && <HomeBookingDetails booking={booking} />}
          <section className="booking-timeline">
            <h2>{t('Perjalanan status pesanan')}</h2>
            <ol>
              {booking.events.map((event) => (
                <li key={event.id}>
                  <span />
                  <div>
                    <strong>{t(event.label)}</strong>
                    <time dateTime={event.at}>
                      {new Intl.DateTimeFormat(
                        locale === 'en' ? 'en-GB' : 'id-ID',
                        {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: property?.zone ?? 'Asia/Jakarta',
                        },
                      ).format(new Date(event.at))}{' '}
                      · {property?.zone}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="hotel-demo-tools">
            <h2>
              <Info size={17} />
              {t('Simulasi pembayaran')}
            </h2>
            <p>
              {t(
                'Kontrol berikut hanya mengubah fakta pada adapter demo lokal, bukan transaksi nyata.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              {canInvoice && booking.invoice?.emailStatus !== 'failed' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void command('invoice_email_failed')}
                >
                  {t('Simulasikan email invoice gagal')}
                </Button>
              )}
              {booking.bookingStatus === 'awaiting_payment' &&
                booking.paymentStatus === 'pending' && (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() => command('payment_succeeded')}
                    >
                      {t('Simulasikan pembayaran berhasil')}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => command('payment_failed')}
                    >
                      {t('Simulasikan pembayaran gagal')}
                    </Button>
                  </>
                )}
              {['awaiting_payment'].includes(booking.bookingStatus) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => command('expire')}
                >
                  {t('Simulasikan kedaluwarsa')}
                </Button>
              )}
              {booking.bookingStatus === 'expired' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => command('late_payment')}
                >
                  {t('Simulasikan pembayaran terlambat')}
                </Button>
              )}
              {booking.refundStatus === 'processing' && (
                <Button
                  disabled={busy}
                  onClick={() => command('refund_succeeded')}
                >
                  {t('Simulasikan refund selesai')}
                </Button>
              )}
            </div>
          </section>
        </div>
        <aside className="hotel-order-summary">
          <div className="p-6">
            <h2>{property?.name ?? t('Hotel')}</h2>
            <p>{t(property?.selectionLabel)}</p>
            <StaySummary
              query={booking.query}
              kind={booking.home ? 'home' : 'hotel'}
            />
            <PriceBreakdown quote={booking.quote} />
            <div className="hotel-policy-box">
              <h3>{t('Kebijakan pada pesanan ini')}</h3>
              <p>
                {t(
                  booking.cancellationPolicy?.label ??
                    (booking.quote.freeCancellation
                      ? 'Tarif fleksibel demo · estimasi refund penuh sebelum layanan.'
                      : 'Tarif non-refundable demo · tanpa refund biaya menginap.'),
                )}
              </p>
            </div>
            {booking.refundAmount > 0 && (
              <p className="hotel-inline-note">
                {t('Nilai refund demo')}:{' '}
                <strong>{formatRupiah(booking.refundAmount, locale)}</strong>
              </p>
            )}
            <div className="booking-side-actions">
              {canInvoice && (
                <Button
                  variant="outline"
                  onClick={() => void downloadInvoice()}
                  disabled={downloading || busy}
                >
                  <Download />
                  {t(
                    downloading
                      ? 'Menyiapkan invoice…'
                      : 'Unduh invoice booking/reservasi',
                  )}
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={refresh}>
                <RefreshCw />
                {t('Periksa status')}
              </Button>
              {canCancel && (
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      {t('Ajukan pembatalan demo')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle className="pr-8 text-xl font-bold">
                      {t('Tinjau pembatalan')}
                    </DialogTitle>
                    <DialogDescription className="mt-3 text-sm leading-7 text-muted-foreground">
                      {t(
                        'Pembatalan pesanan dan pengembalian dana memiliki status yang berbeda.',
                      )}
                    </DialogDescription>
                    <div className="usr-module usr-inline p-4 rounded-xl mt-4">
                      <CancellationPanel
                        id={booking.id}
                        onComplete={() => {
                          setCancelOpen(false);
                          void refresh();
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" asChild>
                <Link href="/info/help">{t('Pusat bantuan')}</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
      <Link
        href={`${property?.path ?? '/hotels'}?${booking.home ? homeParams({ ...booking.query, rooms: 1 }) : hotelParams(booking.query)}`}
        className="section-link my-8"
      >
        <ArrowLeft size={16} />
        {t(booking.home ? 'Cari hunian lainnya' : 'Cari hotel lainnya')}
      </Link>
    </main>
  );
}
