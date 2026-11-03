'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  CalendarDays,
  ChevronDown,
  FlaskConical,
  Info,
  MapPin,
  UsersRound,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/features/home/components/search-panel';
import { DEFAULT_SEARCH, LOCATIONS } from '@/features/home/lib/search';
import { HOTEL_SCENARIOS } from '../lib/query';
import { formatRupiah } from '@/lib/utils';
import type { HotelQuery, HotelQuote, HotelScenario } from '../lib/types';
export function DemoNotice() {
  const { t } = useI18n();
  return (
    <div className="hotel-demo">
      <FlaskConical size={16} />
      <p>
        {t(
          'Demo Phase 02 · Properti, harga, stok, ulasan, dan pembayaran adalah simulasi. Tidak ada transaksi nyata.',
        )}
      </p>
    </div>
  );
}
export function ScenarioControl({
  value,
  onChange,
}: {
  value: HotelScenario;
  onChange: (value: HotelScenario) => void;
}) {
  const { t } = useI18n();
  return (
    <details className="hotel-scenarios">
      <summary>{t('Alat skenario demo')}</summary>
      <label>
        {t('Skenario pengujian')}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as HotelScenario)}
        >
          {HOTEL_SCENARIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
export function dateLabel(date: string, locale: string) {
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.getTime())
    ? date
    : new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(value);
}
export function StaySummary({
  query,
  kind = 'hotel',
}: {
  query: HotelQuery;
  kind?: 'hotel' | 'home';
}) {
  const { t, locale } = useI18n();
  const locationName =
    LOCATIONS.find((l) => l.id === query.locationId)?.label ?? query.locationId;
  return (
    <div className="stay-summary">
      <span>
        <MapPin size={16} />
        {locationName}
      </span>
      <span>
        <CalendarDays size={16} />
        {dateLabel(query.start, locale)} — {dateLabel(query.end, locale)}
      </span>
      <span>
        <UsersRound size={16} />
        {t(
          kind === 'home'
            ? '{guests} tamu · 1 hunian'
            : '{guests} tamu · {rooms} kamar',
          {
            guests: query.adults + query.children,
            rooms: query.rooms,
          },
        )}
      </span>
    </div>
  );
}
export function HotelSearchEditor({ query }: { query: HotelQuery }) {
  const { t } = useI18n();
  return (
    <details className="hotel-search-editor">
      <summary>
        <span>{t('Ubah tanggal & tamu')}</span>
        <ChevronDown size={16} />
      </summary>
      <div className="p-5">
        <SearchForm
          key={`${query.locationId}-${query.start}-${query.end}-${query.rooms}-${query.children}`}
          service="hotel"
          initial={{ ...DEFAULT_SEARCH, ...query }}
          saveDraft={() => {}}
        />
      </div>
    </details>
  );
}
export function PriceBreakdown({ quote }: { quote: HotelQuote }) {
  const { t, locale } = useI18n();
  return (
    <dl className="price-breakdown">
      {quote.promotion && (
        <>
          <div>
            <dt>{t('Tarif dasar sebelum promo')}</dt>
            <dd>{formatRupiah(quote.promotion.originalBase, locale)}</dd>
          </div>
          <div>
            <dt>
              {t('Diskon promo')} ({quote.promotion.percent}%) ·{' '}
              {t('Ditanggung')}: {quote.promotion.fundedBy}
            </dt>
            <dd>−{formatRupiah(quote.promotion.discount, locale)}</dd>
          </div>
        </>
      )}

      <div>
        <dt>
          {t(
            quote.productType === 'home'
              ? '{nights} malam × 1 hunian'
              : '{nights} malam × {rooms} kamar',
            {
              nights: quote.nights,
              rooms: quote.quantity,
            },
          )}
        </dt>
        <dd>{formatRupiah(quote.base, locale)}</dd>
      </div>
      {!!quote.cleaningFee && (
        <div>
          <dt>{t('Biaya kebersihan · per kunjungan')}</dt>
          <dd>{formatRupiah(quote.cleaningFee, locale)}</dd>
        </div>
      )}
      {quote.extras?.map((extra) => (
        <div key={extra.id}>
          <dt>{t(extra.label)}</dt>
          <dd>{formatRupiah(extra.total, locale)}</dd>
        </div>
      ))}
      <div>
        <dt>{t('Pajak')}</dt>
        <dd>{formatRupiah(quote.tax, locale)}</dd>
      </div>
      <div>
        <dt>{t('Biaya layanan')}</dt>
        <dd>{formatRupiah(quote.serviceFee, locale)}</dd>
      </div>
      <div className="price-total">
        <dt>{t('Total menginap')}</dt>
        <dd>{formatRupiah(quote.total, locale)}</dd>
      </div>
    </dl>
  );
}
export function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="hotel-feedback" role="alert">
      <Info size={28} />
      <h2>{t('Belum dapat melanjutkan')}</h2>
      <p>{t(message)}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          <RotateCcw />
          {t('Coba lagi')}
        </Button>
      )}
    </div>
  );
}
export function LoadingCards({
  label = 'Memuat hotel',
}: { label?: string } = {}) {
  const { t } = useI18n();
  return (
    <div aria-busy="true" aria-label={t(label)} className="grid gap-5">
      {[1, 2, 3].map((id) => (
        <div key={id} className="skeleton h-56 rounded-2xl" />
      ))}
    </div>
  );
}
