'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock3,
  UserRound,
  FileCheck,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { carAdapter } from '../lib/adapter';
import { carBookingAdapter } from '../lib/booking-adapter';
import {
  carLink,
  carParams,
  parseCarQuery,
  carScenario,
  parseCarFilters,
} from '../lib/query';
import type { CarResult } from '../lib/types';
import {
  CarNotice,
  CarLoading,
  CarErrorPanel,
  CarMedia,
  CarFacts,
  CarSummary,
  CarPrice,
  CarPackage,
  useCarClock,
} from './shared';
export function CarDetail({ offerId }: { offerId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const qKey = carParams(parseCarQuery(search)).toString();
  const query = useMemo(() => parseCarQuery(new URLSearchParams(qKey)), [qKey]);
  const scenario = carScenario(search),
    key = `${offerId}:${qKey}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    data?: CarResult;
    error?: Error;
  }>();
  const [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false),
    [mutation, setMutation] = useState('');
  const now = useCarClock();
  const mutationAlert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    carAdapter
      .getRentalOffer(offerId, query, scenario, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [offerId, query, scenario, key, attempt]);
  const data = response?.key === key ? response.data : undefined,
    error = response?.key === key ? response.error : undefined;
  const back = carLink(
    '/cars/results',
    query,
    scenario,
    Object.fromEntries(
      Object.entries(parseCarFilters(new URLSearchParams(raw))).map(
        ([k, v]) => [k, String(v)],
      ),
    ),
  );
  async function request() {
    setBusy(true);
    setMutation('');
    try {
      const draft = await carBookingAdapter.createDraft(
        offerId,
        query,
        scenario,
      );
      router.push(`/checkout/car/${draft.id}`);
    } catch (error) {
      setMutation(
        error instanceof Error
          ? error.message
          : 'Layanan rental sedang terganggu. Silakan coba lagi.',
      );
      requestAnimationFrame(() => mutationAlert.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <main id="main" className="car-module page-container car-detail">
        <Link href={back} className="car-back">
          <ArrowLeft size={17} />
          {t('Kembali ke hasil mobil')}
        </Link>
        {error ? (
          <CarErrorPanel
            error={error}
            onRetry={() => setAttempt((v) => v + 1)}
          />
        ) : (
          <CarLoading />
        )}
      </main>
    );
  const expired = now > Date.parse(data.quote.expiresAt);
  return (
    <main id="main" className="car-module page-container car-detail">
      <Link href={back} className="car-back">
        <ArrowLeft size={17} />
        {t('Kembali ke hasil mobil')}
      </Link>
      <CarNotice />
      <div className="car-detail-heading">
        <div>
          <p className="car-provider">{data.offer.providerName} · DEMO</p>
          <h1>{data.offer.name}</h1>
          <CarFacts offer={data.offer} />
        </div>
        <span className="car-mode-badge">
          {t(
            data.offer.mode === 'driver'
              ? 'Dengan pengemudi'
              : 'Tanpa pengemudi',
          )}{' '}
          · {t('Paket {hours} jam', { hours: data.offer.unitHours })}
        </span>
      </div>
      {(!data.available || expired) && (
        <p className="car-warning">
          {t(
            expired
              ? 'Estimasi kedaluwarsa. Perbarui rincian sebelum mengajukan.'
              : (data.reason ?? 'Armada belum tersedia.'),
          )}
          {expired && (
            <button
              onClick={() =>
                scenario === 'quote_expired'
                  ? router.replace(carLink(`/cars/${offerId}`, query))
                  : setAttempt((v) => v + 1)
              }
            >
              {t('Perbarui estimasi')}
            </button>
          )}
        </p>
      )}
      {mutation && (
        <p
          className="car-validation"
          role="alert"
          tabIndex={-1}
          ref={mutationAlert}
        >
          {t(mutation)}
        </p>
      )}

      <div className="car-detail-layout">
        <div>
          <div className="car-detail-photo">
            <CarMedia offer={data.offer} priority />
            <span>
              {t('Foto atau ilustrasi kelas, bukan jaminan model unit.')}
            </span>
          </div>
          <section className="car-section car-mobile-price">
            <h2>{t('Rincian biaya rental')}</h2>
            <CarPrice quote={data.quote} offer={data.offer} full />
          </section>
          <section className="car-section">
            <h2>{t('Jadwal & area perjalanan')}</h2>
            <CarSummary query={query} />
            <p className="car-hint">
              {t(
                'Titik temu rinci diisi saat mengajukan. Kembali pada area yang sama.',
              )}
            </p>
          </section>
          <section className="car-section">
            <CarPackage offer={data.offer} />
          </section>
          <section className="car-section">
            <div className="car-section-heading">
              <ShieldCheck size={22} />
              <h2>{t('Persyaratan sebelum membayar')}</h2>
            </div>
            <ul className="car-points">
              <li>
                <UserRound size={18} />
                {t('Usia penyewa minimal {age} tahun sesuai kebijakan mitra.', {
                  age: data.offer.minAge,
                })}
              </li>
              <li>
                <FileCheck size={18} />
                {t(
                  data.offer.mode === 'self'
                    ? 'SIM A yang masih berlaku dan identitas asli diperiksa oleh mitra.'
                    : 'Identitas penyewa diperiksa oleh mitra; SIM tidak diwajibkan untuk penumpang.',
                )}
              </li>
              <li>
                <Clock3 size={18} />
                {t('Ajukan minimal {hours} jam sebelum pengambilan.', {
                  hours: data.offer.leadHours,
                })}
              </li>
              <li>
                <Info size={18} />
                {t(
                  data.offer.uploadRequired
                    ? 'Paket ini meminta satu dokumen SIM contoh pada demo untuk meninjau alur verifikasi.'
                    : 'Tidak ada unggahan dokumen awal. Pemeriksaan identitas dilakukan oleh mitra saat tindak lanjut.',
                )}
              </li>
            </ul>
          </section>
          <section className="car-section car-flow">
            <h2>{t('Dari permintaan sampai kembali')}</h2>
            <ol>
              {[
                'Ajukan lewat akun',
                'Mitra memeriksa syarat & armada',
                'Bayar setelah disetujui',
                'Pickup, gunakan, lalu kembali',
              ].map((label, i) => (
                <li key={label}>
                  <span>{i + 1}</span>
                  {t(label)}
                </li>
              ))}
            </ol>
            <p>
              {t(
                'Permintaan belum mengunci kendaraan. Persetujuan mengalokasikan armada dan membuka pembayaran dalam batas waktu.',
              )}
            </p>
          </section>
        </div>
        <aside className="car-booking-summary">
          <div className="car-summary-icon">
            <CarFrontIcon />
          </div>
          <h2>{t('Rencana rental Anda')}</h2>
          <CarSummary query={query} />
          <CarPrice quote={data.quote} offer={data.offer} full />
          <Button
            className="w-full"
            disabled={!data.available || expired || busy}
            onClick={request}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{' '}
            {t('Ajukan rental')}
          </Button>
          <p className="car-hint">
            {t(
              'Belum ada pembayaran. Mitra akan memeriksa kelayakan, unit, dan pengemudi bila diperlukan.',
            )}
          </p>
          <p className="car-hint">
            {t(
              'Buffer serah terima {minutes} menit diperiksa sebelum persetujuan.',
              { minutes: data.offer.bufferMinutes },
            )}
          </p>
        </aside>
      </div>
      <div className="car-sticky-action">
        <span>
          {t('Total durasi rental')}
          <strong>
            <PriceNumber total={data.quote.total} />
          </strong>
        </span>
        <Button disabled={!data.available || expired || busy} onClick={request}>
          {t('Ajukan rental')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </main>
  );
}
import { CarFront as CarFrontIcon } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
function PriceNumber({ total }: { total: number }) {
  const { locale } = useI18n();
  return <>{formatRupiah(total, locale)}</>;
}
