'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Info,
  Download,
  RefreshCw,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  Phone,
  FileCheck,
  AlertCircle,
  FlaskConical,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { formatRupiah } from '@/lib/utils';
import {
  carBookingAdapter,
  canDownloadCarInvoice,
} from '../lib/booking-adapter';
import { CarError } from '../lib/error';
import { carScenario, rentalInterval } from '../lib/query';
import { CAR_STATUSES, CAR_ZONE, CAR_CLASSES } from '../lib/config';
import type { CarAction, CarBooking as Booking } from '../lib/types';
import {
  CarNotice,
  CarPrice,
  CarFacts,
  CarSummary,
  CarLoading,
  CarErrorPanel,
  useCarClock,
} from './shared';
export function CarBooking({ bookingId }: { bookingId: string }) {
  const account = useDemoAccount();
  return (
    <CarBookingBody
      key={`${bookingId}:${account?.id ?? 'guest'}`}
      bookingId={bookingId}
    />
  );
}
function CarBookingBody({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n();
  const account = useDemoAccount();
  const search = useSearchParams(),
    scenario = carScenario(search);
  const key = `${bookingId}:${account?.id ?? 'guest'}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    value?: Booking;
    error?: Error;
  }>();
  const [busy, setBusy] = useState(false),
    [mutation, setMutation] = useState(''),
    [unknown, setUnknown] = useState(false),
    [paymentMethod, setPaymentMethod] = useState<'va' | 'qris'>('va'),
    [download, setDownload] = useState(false),
    [confirm, setConfirm] = useState<CarAction | null>(null);
  const alert = useRef<HTMLDivElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const now = useCarClock();
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const value = await carBookingAdapter.getBookingStatus(
          bookingId,
          scenario,
          signal,
        );
        setResponse((previous) =>
          previous?.key === key &&
          previous.value &&
          previous.value.events.length > value.events.length
            ? previous
            : { key, value },
        );
        setUnknown(false);
        setMutation('');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      }
    },
    [bookingId, scenario, key],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => refresh(controller.signal));
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    return () => {
      controller.abort();
      window.removeEventListener('focus', focus);
    };
  }, [refresh]);
  async function run(action: CarAction) {
    setBusy(true);
    setMutation('');
    try {
      const value = await carBookingAdapter.command(
        bookingId,
        action,
        `${action}:${crypto.randomUUID()}`,
        paymentMethod,
        scenario,
      );
      setResponse((previous) =>
        previous?.key === key &&
        previous.value &&
        previous.value.events.length > value.events.length
          ? previous
          : { key, value },
      );
      setConfirm(null);
    } catch (error) {
      setMutation(
        error instanceof Error
          ? error.message
          : 'Layanan rental sedang terganggu. Silakan coba lagi.',
      );
      setConfirm(null);
      setUnknown(error instanceof CarError && error.code === 'UNKNOWN');
      if (error instanceof CarError && ['401', '403'].includes(error.code))
        setResponse({ key, error });
      requestAnimationFrame(() => alert.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  const value = response?.key === key ? response.value : undefined,
    error = response?.key === key ? response.error : undefined;
  async function invoice() {
    if (!value) return;
    setDownload(true);
    try {
      const { createCarInvoicePdf } = await import('../lib/invoice-pdf');
      const bytes = await createCarInvoicePdf(value, locale, t);
      const url = URL.createObjectURL(
        new Blob([bytes], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${value.invoice!.number}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setMutation(
        error instanceof Error
          ? error.message
          : 'Invoice belum dapat diunduh. Silakan coba lagi.',
      );
    } finally {
      setDownload(false);
    }
  }
  if (!value)
    return (
      <main id="main" className="car-module page-container car-booking">
        <Link href="/cars" className="car-back">
          <ArrowLeft size={17} />
          {t('Kembali ke rental mobil')}
        </Link>
        <CarNotice />
        <Link
          href="/account/bookings"
          className="inline-flex my-4 text-blue-700 font-semibold text-sm"
        >
          ← {t('Kembali ke dashboard akun')}
        </Link>
        {error ? (
          error instanceof CarError && error.code === '401' ? (
            <AccountAccess purpose="car" />
          ) : (
            <CarErrorPanel error={error} onRetry={() => void refresh()} />
          )
        ) : (
          <CarLoading />
        )}
      </main>
    );
  const canPay =
    value.status === 'awaiting_payment' &&
    !!value.expiresAt &&
    Date.parse(value.expiresAt) > now;
  const contactReady =
    now > 0 &&
    (rentalInterval(value.query).start - now < 24 * 3600000 ||
      ['in_use', 'completed'].includes(value.status));
  const operations: { action: CarAction; label: string }[] = [];
  if (value.status === 'requested')
    operations.push(
      { action: 'approve', label: 'Simulasikan persetujuan mitra' },
      { action: 'reject', label: 'Simulasikan penolakan kelayakan' },
      { action: 'maintenance', label: 'Simulasikan maintenance armada' },
      ...(value.offer.mode === 'driver'
        ? [
            {
              action: 'driver_conflict' as const,
              label: 'Simulasikan konflik pengemudi',
            },
          ]
        : []),
    );
  if (value.status === 'awaiting_payment') {
    operations.push(
      { action: 'expire', label: 'Simulasikan pembayaran kedaluwarsa' },
      { action: 'maintenance', label: 'Simulasikan maintenance armada' },
    );
    if (value.payment === 'pending')
      operations.push(
        {
          action: 'payment_succeeded',
          label: 'Simulasikan pembayaran berhasil',
        },
        { action: 'payment_failed', label: 'Simulasikan pembayaran gagal' },
      );
  }
  if (['expired', 'cancelled'].includes(value.status))
    operations.push({
      action: 'late_payment',
      label: 'Simulasikan pembayaran terlambat',
    });
  if (value.status === 'confirmed')
    operations.push(
      ...(!value.replacement
        ? [
            {
              action: 'propose_replacement' as const,
              label: 'Usulkan kendaraan pengganti',
            },
            { action: 'pickup' as const, label: 'Catat serah terima demo' },
          ]
        : []),
    );
  if (value.status === 'in_use')
    operations.push({ action: 'return', label: 'Catat pengembalian demo' });
  if (value.refund === 'processing')
    operations.push({
      action: 'refund_succeeded',
      label: 'Selesaikan refund demo',
    });
  if (value.invoice)
    operations.push({
      action: 'invoice_email_failed',
      label: 'Simulasikan email invoice gagal',
    });
  return (
    <main id="main" className="car-module page-container car-booking">
      <Link href="/cars" className="car-back">
        <ArrowLeft size={17} />
        {t('Kembali ke rental mobil')}
      </Link>
      <CarNotice />
      <div className="car-page-heading">
        <p className="car-kicker">{t('RENCANA RENTAL, DALAM PANTAUAN')}</p>
        <h1>{t('Perjalanan Anda dimulai di sini.')}</h1>
        <p>{value.id}</p>
      </div>
      <div className="car-status-strip">
        <div>
          <span>{t('Status rental')}</span>
          <strong>{t(CAR_STATUSES[value.status])}</strong>
        </div>
        <div>
          <span>{t('Status pembayaran')}</span>
          <strong>
            {t(
              value.payment === 'succeeded'
                ? 'Pembayaran diterima'
                : value.payment === 'pending'
                  ? 'Menunggu hasil pembayaran'
                  : value.payment === 'failed'
                    ? 'Pembayaran gagal'
                    : value.status === 'requested' ||
                        value.status === 'rejected'
                      ? 'Belum ada tagihan'
                      : value.payment === 'expired'
                        ? 'Pembayaran kedaluwarsa'
                        : 'Belum dibayar',
            )}
          </strong>
        </div>
        <div>
          <span>{t('Status refund')}</span>
          <strong>
            {t(
              value.refund === 'none'
                ? 'Tidak ada refund'
                : value.refund === 'processing'
                  ? 'Refund dalam pemeriksaan'
                  : 'Refund selesai',
            )}
          </strong>
        </div>
      </div>
      {mutation && (
        <div className="car-validation" role="alert" tabIndex={-1} ref={alert}>
          <p>{t(mutation)}</p>
          {unknown && (
            <Button variant="outline" onClick={() => void refresh()}>
              {t('Periksa status pengiriman')}
            </Button>
          )}
        </div>
      )}
      <div className="car-checkout-layout">
        <div>
          <section
            className={`car-state-banner ${['confirmed', 'in_use', 'completed'].includes(value.status) ? 'success' : ''}`}
          >
            <ShieldCheck size={27} />
            <h2 ref={statusHeading} tabIndex={-1}>
              {t(CAR_STATUSES[value.status])}
            </h2>
            <p>
              {t(
                value.status === 'requested'
                  ? 'Permintaan terkirim. Mitra akan memeriksa syarat penyewa, ketersediaan unit, pengemudi, dan buffer. Belum ada reservasi atau tagihan.'
                  : (value.reason ??
                      (['confirmed', 'in_use', 'completed'].includes(
                        value.status,
                      )
                        ? 'Pembayaran terverifikasi. Informasi reservasi dan invoice booking tersedia di bawah.'
                        : 'Ikuti status terbaru sebelum melanjutkan pembayaran.')),
              )}
            </p>
            {value.expiresAt && value.status === 'awaiting_payment' && (
              <p>
                <Clock3 size={17} />
                {t('Batas pembayaran {time}', {
                  time: new Intl.DateTimeFormat(
                    locale === 'en' ? 'en-GB' : 'id-ID',
                    {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: CAR_ZONE(value.query.locationId),
                    },
                  ).format(new Date(value.expiresAt)),
                })}{' '}
                · {CAR_ZONE(value.query.locationId)}
              </p>
            )}
            {value.status === 'awaiting_payment' && !canPay && (
              <p>
                {t(
                  'Batas waktu pada layar telah terlewati. Periksa status untuk hasil terbaru; belum ada konfirmasi otomatis.',
                )}
              </p>
            )}
          </section>
          {value.status === 'awaiting_payment' && (
            <section className="car-section car-payment">
              <h2>{t('Bayar setelah persetujuan')}</h2>
              <p>
                {t(
                  'Total pembayaran platform {amount}. Deposit tetap di mitra.',
                  { amount: formatRupiah(value.quote.total, locale) },
                )}
              </p>
              {value.payment === 'pending' ? (
                <div className="car-payment-instructions">
                  {value.paymentMethod === 'qris' ? (
                    <QrCode size={90} aria-hidden="true" />
                  ) : (
                    <strong>8808 0000 1234</strong>
                  )}
                  <h3>
                    {value.paymentMethod === 'qris'
                      ? 'QRIS Demo'
                      : 'Virtual Account Demo'}
                  </h3>
                  <p>
                    {t(
                      'Instruksi pembayaran simulasi. Jangan melakukan transfer nyata. Hasil pembayaran mengikuti fakta adapter demo.',
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <fieldset className="car-payment-methods">
                    <legend>{t('Metode pembayaran')}</legend>
                    {(['va', 'qris'] as const).map((method) => (
                      <label key={method}>
                        <input
                          type="radio"
                          name="car-payment"
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                        />
                        {method === 'va' ? 'Virtual Account' : 'QRIS'}
                      </label>
                    ))}
                  </fieldset>
                  <Button
                    className="w-full"
                    disabled={!canPay || busy || unknown}
                    onClick={() => void run('start_payment')}
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <ShieldCheck size={18} />
                    )}{' '}
                    {t('Buka pembayaran demo')}
                  </Button>
                </>
              )}
            </section>
          )}
          {value.replacement && (
            <section className="car-replacement">
              <AlertCircle size={25} />
              <h2>{t('Tinjau perubahan kendaraan')}</h2>
              <p>
                {t(
                  'Pengganti ini berbeda dari kelas awal. Persetujuan Anda diperlukan; total pembayaran tetap.',
                )}
              </p>
              <div>
                <strong>{value.replacement.model}</strong>
                <p>
                  {t('{count} kursi', { count: value.replacement.seats })} ·{' '}
                  {value.replacement.baggage === null
                    ? t('Bagasi perlu konfirmasi')
                    : t('{count} koper', { count: value.replacement.baggage })}
                </p>
                <p>
                  {t('Kendaraan awal: {name}', {
                    name: value.assignment?.model ?? value.offer.name,
                  })}
                </p>
              </div>
              <Button
                disabled={busy || unknown}
                onClick={(event) => {
                  dialogTrigger.current = event.currentTarget;
                  setConfirm('accept_replacement');
                }}
              >
                {t('Tinjau & setujui pengganti')}
              </Button>
              <Button
                variant="outline"
                disabled={busy || unknown}
                onClick={() => void run('reject_replacement')}
              >
                {t('Pertahankan kendaraan awal')}
              </Button>
            </section>
          )}
          {value.assignment && (
            <section className="car-section">
              <h2>{t('Kendaraan & layanan Anda')}</h2>
              <div className="car-assignment">
                <CheckCircle2 size={24} />
                <div>
                  <strong>{value.assignment.model}</strong>
                  <p>
                    {t('{count} kursi', { count: value.assignment.seats })} ·{' '}
                    {t(
                      value.assignment.transmission === 'automatic'
                        ? 'Otomatis'
                        : 'Manual',
                    )}
                  </p>
                  <p>
                    {contactReady
                      ? value.assignment.plate
                      : t('Identitas unit ditampilkan menjelang pengambilan.')}
                  </p>
                </div>
              </div>
              {value.offer.mode === 'driver' && (
                <div className="car-assignment">
                  <UserRound size={22} />
                  <div>
                    <strong>{t('Pengemudi dari mitra')}</strong>
                    <p>
                      {contactReady
                        ? value.assignment.driverName
                        : t(
                            'Nama dan kontak layanan tersedia dalam 24 jam menjelang pengambilan.',
                          )}
                    </p>
                    {contactReady && (
                      <p>
                        <Phone size={15} /> 0800 000 000 ·{' '}
                        {t('Kontak demo, tidak untuk dihubungi')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <p className="car-hint">
                {t('Titik temu')}: {value.renter.pickupDetail}
              </p>
            </section>
          )}
          {canDownloadCarInvoice(value) && (
            <section className="car-invoice">
              <FileCheck size={27} />
              <h2>{t('Invoice booking/reservasi')}</h2>
              <p>
                {t(
                  value.invoice?.emailStatus === 'failed'
                    ? 'Simulasi email gagal. Reservasi tetap berlaku; unduh invoice atau coba kirim ulang.'
                    : 'Pengiriman invoice ke {email} disimulasikan. Email tidak benar-benar dikirim.',
                  { email: value.contact.email },
                )}
              </p>
              <Button disabled={download} onClick={() => void invoice()}>
                {download ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Download size={18} />
                )}{' '}
                {t('Unduh invoice booking/reservasi')}
              </Button>
              <Button
                variant="outline"
                disabled={busy || unknown}
                onClick={() => void run('resend_invoice')}
              >
                {t('Kirim ulang invoice demo')}
              </Button>
            </section>
          )}
          {['confirmed', 'in_use', 'completed'].includes(value.status) && (
            <section className="car-section">
              <h2>{t('Checklist pickup & pengembalian')}</h2>
              <div className="car-handover-grid">
                {(
                  [
                    {
                      key: 'pickup',
                      title: 'Serah terima',
                      fuel: value.handover.fuelStart,
                      km: value.handover.odometerStart,
                      condition: value.handover.conditionStart,
                    },
                    {
                      key: 'returned',
                      title: 'Pengembalian',
                      fuel: value.handover.fuelEnd,
                      km: value.handover.odometerEnd,
                      condition: value.handover.conditionEnd,
                    },
                  ] as const
                ).map((item) => (
                  <div key={item.key}>
                    <strong>
                      <CheckCircle2 size={18} />
                      {t(item.title)}
                    </strong>
                    <p>
                      {t(
                        value.handover[item.key]
                          ? 'Sudah dicatat'
                          : 'Belum dicatat',
                      )}
                    </p>
                    {value.handover[item.key] && (
                      <dl>
                        <div>
                          <dt>{t('BBM')}</dt>
                          <dd>{t(item.fuel ?? 'Perlu konfirmasi')}</dd>
                        </div>
                        <div>
                          <dt>{t('Odometer')}</dt>
                          <dd>{item.km} km</dd>
                        </div>
                        <div>
                          <dt>{t('Kondisi')}</dt>
                          <dd>{t(item.condition ?? 'Perlu konfirmasi')}</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                ))}
              </div>
              <p className="car-hint">
                {t(
                  'Deposit diselesaikan langsung dengan mitra. Checklist dan sengketa tidak membuat tagihan overtime atau kerusakan otomatis.',
                )}
              </p>
              {['in_use', 'completed'].includes(value.status) && (
                <Button
                  variant="outline"
                  disabled={value.dispute || busy || unknown}
                  onClick={() => void run('dispute')}
                >
                  {t(
                    value.dispute
                      ? 'Pemeriksaan kondisi diminta'
                      : 'Ajukan pemeriksaan kondisi',
                  )}
                </Button>
              )}
            </section>
          )}
          <section className="car-history">
            <h2>{t('Riwayat rental')}</h2>
            <ol>
              {value.events.map((event) => (
                <li key={event.id}>
                  <span />
                  <div>
                    <strong>{t(event.label)}</strong>
                    <time>
                      {new Intl.DateTimeFormat(
                        locale === 'en' ? 'en-GB' : 'id-ID',
                        {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: CAR_ZONE(value.query.locationId),
                        },
                      ).format(new Date(event.at))}{' '}
                      · {CAR_ZONE(value.query.locationId)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <details className="car-demo-tools">
            <summary>
              <FlaskConical size={18} />
              {t('Simulasi Rental Operations')}
            </summary>
            <p>
              {t(
                'Kontrol lokal untuk mencoba verifikasi, alokasi, pembayaran, dan serah terima. Tidak menghubungi mitra atau memindahkan uang nyata.',
              )}
            </p>
            <div>
              {operations.map((op) => (
                <Button
                  key={op.action}
                  variant="outline"
                  size="sm"
                  disabled={busy || unknown}
                  onClick={() => void run(op.action)}
                >
                  {t(op.label)}
                </Button>
              ))}
            </div>
          </details>
        </div>
        <aside className="car-booking-summary">
          <h2>{value.assignment?.model ?? value.offer.name}</h2>
          <p className="car-provider">{value.offer.providerName}</p>
          <CarFacts
            offer={
              value.assignment
                ? {
                    ...value.offer,
                    seats: value.assignment.seats,
                    baggage: value.assignment.baggage,
                    transmission: value.assignment.transmission,
                  }
                : value.offer
            }
          />
          <CarSummary query={value.query} />
          <CarPrice quote={value.quote} offer={value.offer} full />
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <RefreshCw size={18} />
            {t('Periksa status')}
          </Button>
          {['requested', 'awaiting_payment'].includes(value.status) && (
            <Button
              variant="outline"
              className="w-full mt-3"
              disabled={busy || unknown}
              onClick={(event) => {
                dialogTrigger.current = event.currentTarget;
                setMutation('');
                setConfirm('cancel');
              }}
            >
              {t('Batalkan permintaan rental')}
            </Button>
          )}
          <p className="car-hint">
            <Info size={16} />
            {t(
              'Status hanya berubah dari hasil adapter. Timer pada layar tidak mengonfirmasi pembayaran atau kendaraan.',
            )}
          </p>
        </aside>
      </div>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (dialogTrigger.current?.isConnected)
              dialogTrigger.current.focus();
            else statusHeading.current?.focus();
          }}
        >
          <DialogTitle>
            {t(
              confirm === 'cancel'
                ? 'Batalkan permintaan rental?'
                : 'Setujui perubahan kendaraan?',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              confirm === 'cancel'
                ? 'Permintaan dan alokasi yang belum dibayar akan dilepas.'
                : 'Tinjau kelas, kursi, dan bagasi pengganti. Total pembayaran tidak bertambah.',
            )}
          </DialogDescription>
          <p>
            {value.id} · {value.replacement?.model ?? value.offer.name}
          </p>
          {value.replacement && (
            <p>
              {t(CAR_CLASSES[value.replacement.vehicleClass])} ·{' '}
              {t('{count} kursi', { count: value.replacement.seats })} ·{' '}
              {value.replacement.baggage === null
                ? t('Bagasi perlu konfirmasi')
                : t('{count} koper', { count: value.replacement.baggage })}
            </p>
          )}
          <p>{formatRupiah(value.quote.total, locale)}</p>
          <Button
            disabled={busy || unknown}
            onClick={() => confirm && void run(confirm)}
          >
            {t(
              confirm === 'cancel'
                ? 'Ya, batalkan permintaan'
                : 'Saya setuju dengan kendaraan pengganti',
            )}
          </Button>
          <Button variant="outline" onClick={() => setConfirm(null)}>
            {t('Kembali')}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
