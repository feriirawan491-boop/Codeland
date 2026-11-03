'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  CarFront,
  CalendarDays,
  MapPin,
  UsersRound,
  Luggage,
  Gauge,
  Info,
  Clock3,
  AlertCircle,
  LoaderCircle,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { LOCATIONS } from '@/features/home/lib/search';
import { formatRupiah } from '@/lib/utils';
import { carAreaLabel, CAR_ZONE } from '../lib/config';
import { CarError } from '../lib/error';
import type { CarOffer, CarQuery, CarQuote } from '../lib/types';
export function useCarClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return now;
}
export function CarNotice() {
  const { t } = useI18n();
  return (
    <div className="car-demo">
      <Info size={18} />
      <p>
        {t(
          'Demo Phase 07 · Armada, verifikasi, pembayaran, dan serah terima menggunakan simulasi lokal.',
        )}
      </p>
    </div>
  );
}
export function RentalModeLabel({ mode }: { mode: CarQuery['mode'] }) {
  const { t } = useI18n();
  return <>{t(mode === 'driver' ? 'Dengan pengemudi' : 'Tanpa pengemudi')}</>;
}
export function CarLoading() {
  const { t } = useI18n();
  return (
    <section className="car-loading" aria-busy="true">
      <p role="status">
        <LoaderCircle className="animate-spin" size={18} />
        {t('Memuat pilihan rental…')}
      </p>
      <div className="skeleton h-48 rounded-2xl" />
      <div className="skeleton h-32 rounded-2xl" />
    </section>
  );
}
export function CarErrorPanel({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  const now = useCarClock();
  const [retryAt] = useState(
    () =>
      Date.now() +
      ((error instanceof CarError ? error.retryAfter : 0) ?? 0) * 1000,
  );
  const wait =
    error instanceof CarError && error.code === '429' && now < retryAt;
  return (
    <div className="car-error" role="alert">
      <AlertCircle size={24} />
      <h2>
        {t(
          error instanceof CarError && error.code === '404'
            ? 'Paket atau pesanan tidak ditemukan'
            : 'Periksa kembali rental Anda',
        )}
      </h2>
      <p>{t(error.message)}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={onRetry}
          disabled={wait}
        >
          {t(wait ? 'Tunggu sebentar' : 'Coba lagi')}
        </Button>
      )}
    </div>
  );
}
export function CarMedia({
  offer,
  priority = false,
}: {
  offer: Pick<CarOffer, 'vehicleClass' | 'image' | 'name'>;
  priority?: boolean;
}) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (failed || offer.vehicleClass === 'mpv' || offer.vehicleClass === 'van')
    return (
      <div
        className={`car-art car-art-${offer.vehicleClass}`}
        role="img"
        aria-label={t('Ilustrasi kelas kendaraan {name}', { name: offer.name })}
      >
        <svg viewBox="0 0 600 320" fill="none" aria-hidden="true">
          <ellipse
            cx="300"
            cy="262"
            rx="240"
            ry="17"
            fill="#172554"
            opacity=".10"
          />
          <path
            d={
              offer.vehicleClass === 'van'
                ? 'M70 218V121Q70 91 106 91H453Q480 91 493 126L534 212V235H70Z'
                : 'M65 215L93 160L152 145L207 100H377Q410 100 441 144L492 159L535 214V237H65Z'
            }
            fill="#fff"
            stroke="#2563eb"
            strokeWidth="5"
          />
          <path
            d={
              offer.vehicleClass === 'van'
                ? 'M96 115H435L465 167H96Z'
                : 'M168 145L218 116H371Q394 116 419 145Z'
            }
            fill="#bfdbfe"
            stroke="#2563eb"
            strokeWidth="4"
          />
          {[245, 320, 395].map((x) => (
            <path
              key={x}
              d={`M${x} 115V165`}
              stroke="#2563eb"
              strokeWidth="5"
            />
          ))}
          <rect x="83" y="184" width="30" height="13" rx="5" fill="#93c5fd" />
          <rect x="490" y="184" width="25" height="13" rx="4" fill="#93c5fd" />
          <path
            d="M218 179H244M342 179H368"
            stroke="#2563eb"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {[159, 447].map((x) => (
            <g key={x}>
              <circle cx={x} cy="237" r="35" fill="#172554" />
              <circle cx={x} cy="237" r="17" fill="#dbeafe" />
              <circle cx={x} cy="237" r="6" fill="#2563eb" />
            </g>
          ))}
        </svg>
        <span>{t('Ilustrasi kelas kendaraan')}</span>
      </div>
    );
  return (
    <Image
      src={`/images/${offer.image}.jpg`}
      alt={t('Ilustrasi kendaraan {name}', { name: offer.name })}
      fill
      sizes="(max-width:767px) 95vw, 650px"
      priority={priority}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
export function CarFacts({ offer }: { offer: CarOffer }) {
  const { t } = useI18n();
  return (
    <div className="car-facts">
      <span>
        <UsersRound size={17} />
        {t('{count} kursi', { count: offer.seats })}
      </span>
      <span>
        <Luggage size={17} />
        {offer.baggage === null
          ? t('Bagasi perlu konfirmasi')
          : t('{count} koper', { count: offer.baggage })}
      </span>
      <span>
        <Gauge size={17} />
        {t(offer.transmission === 'automatic' ? 'Otomatis' : 'Manual')}
      </span>
    </div>
  );
}
export function CarSummary({ query }: { query: CarQuery }) {
  const { t } = useI18n();
  return (
    <div className="car-summary">
      <span>
        <MapPin size={16} />
        {LOCATIONS.find((l) => l.id === query.locationId)?.label ??
          query.locationId}{' '}
        · {t(carAreaLabel(query.pickupArea))}
      </span>
      <span>
        <CalendarDays size={16} />
        {query.start} {query.startTime} → {query.end} {query.endTime}
      </span>
      <span>
        <Clock3 size={16} />
        {CAR_ZONE(query.locationId)} · <RentalModeLabel mode={query.mode} />
      </span>
    </div>
  );
}
export function CarPrice({
  quote,
  offer,
  full = false,
}: {
  quote: CarQuote;
  offer: CarOffer;
  full?: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="car-price">
      <small>{t('Total untuk seluruh durasi')}</small>
      <strong>{formatRupiah(quote.total, locale)}</strong>
      <p>
        {t('{hours} jam · {units} × paket {unitHours} jam', {
          hours: quote.durationHours,
          units: quote.units,
          unitHours: quote.unitHours,
        })}
      </p>
      {full && (
        <dl>
          {quote.promotion && (
            <div>
              <dt>
                {t('Diskon promo per unit')} ({quote.promotion.percent}%) ·{' '}
                {t('Ditanggung')}: {quote.promotion.fundedBy}
              </dt>
              <dd>−{formatRupiah(quote.promotion.discount, locale)}</dd>
            </div>
          )}

          <div>
            <dt>{t('Sewa kendaraan & paket')}</dt>
            <dd>{formatRupiah(quote.base, locale)}</dd>
          </div>
          <div>
            <dt>{t('Pengantaran / pengambilan')}</dt>
            <dd>{formatRupiah(quote.deliveryFee, locale)}</dd>
          </div>
          <div>
            <dt>{t('Biaya layanan')}</dt>
            <dd>{formatRupiah(quote.serviceFee, locale)}</dd>
          </div>
          <div>
            <dt>{t('Pajak')}</dt>
            <dd>{formatRupiah(quote.tax, locale)}</dd>
          </div>
        </dl>
      )}
      <div className="car-deposit">
        <Info size={15} />
        <span>
          {quote.deposit
            ? t(
                'Deposit {amount} dibayar terpisah kepada mitra, bukan bagian total platform.',
                { amount: formatRupiah(quote.deposit, locale) },
              )
            : t('Tanpa deposit pada paket ini.')}
        </span>
      </div>
      {full && (
        <p className="car-hint">
          {t(
            'Durasi dibulatkan ke atas per paket {hours} jam. Overtime penggunaan nyata memerlukan kesepakatan terpisah.',
            { hours: offer.unitHours },
          )}
        </p>
      )}
    </div>
  );
}
export function CarPackage({ offer }: { offer: CarOffer }) {
  const { t, locale } = useI18n();
  return (
    <>
      <div className="car-section-heading">
        <CarFront size={22} />
        <h2>{t('Isi paket & biaya penggunaan')}</h2>
      </div>
      <div className="car-inclusions">
        {[
          { label: 'Pengemudi', included: offer.mode === 'driver' },
          { label: 'BBM dalam area layanan', included: offer.fuel },
          { label: 'Tol', included: offer.toll },
          { label: 'Parkir', included: offer.parking },
        ].map((item) => (
          <div key={item.label}>
            {item.included ? <Check size={19} /> : <X size={19} />}
            <span>{t(item.label)}</span>
            <strong>{t(item.included ? 'Termasuk' : 'Tidak termasuk')}</strong>
          </div>
        ))}
      </div>
      <ul className="car-points">
        <li>
          <Clock3 size={18} />
          {t(
            'Satu unit paket berlaku {hours} jam; tambahan durasi pencarian dibulatkan ke unit berikutnya.',
            { hours: offer.unitHours },
          )}
        </li>
        <li>
          <MapPin size={18} />
          {t(
            'Pemakaian dalam kota terpilih. Ambil dan kembali pada area yang sama; rute luar kota perlu paket lain.',
          )}
        </li>
        <li>
          <Info size={18} />
          {t(
            'Tarif acuan overtime {amount}/jam, hanya setelah persetujuan terpisah. Tidak ditagih otomatis.',
            { amount: formatRupiah(offer.overtime, locale) },
          )}
        </li>
        <li>
          <Info size={18} />
          {t(offer.protection)}
        </li>
      </ul>
    </>
  );
}
