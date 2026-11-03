'use client';
import { useEffect, useState } from 'react';
import {
  WeddingNotice,
  WeddingSummary,
} from '@/features/wedding/components/shared';
import {
  Accessibility,
  AudioLines,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Info,
  LayoutGrid,
  MapPin,
  RectangleHorizontal,
  Rows3,
  ScanLine,
  UsersRound,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import {
  LAYOUT_LABELS,
  FACILITY_LABELS,
  VENUE_SCENARIOS,
} from '@/features/venue/lib/config';
import { LOCATIONS } from '@/features/home/lib/search';
import { VenueError } from '@/features/venue/lib/adapter';
import type {
  EventQuery,
  EventLayout,
  VenueFacility,
  VenueScenario,
} from '@/features/venue/lib/types';
export const LAYOUT_ICONS: Record<EventLayout, LucideIcon> = {
  theater: LayoutGrid,
  classroom: Rows3,
  boardroom: RectangleHorizontal,
  ushape: ScanLine,
  banquet: Utensils,
  standing: UsersRound,
};
export const FACILITY_ICONS: Record<VenueFacility, LucideIcon> = {
  av: AudioLines,
  wifi: Wifi,
  parking: CarFront,
  catering: Utensils,
  accessible: Accessibility,
};
export function VenueDemoNotice({
  service = 'mice',
}: { service?: 'mice' | 'wedding' } = {}) {
  const { t } = useI18n();
  if (service === 'wedding') return <WeddingNotice />;
  return (
    <div className="venue-demo">
      <FlaskConical size={17} />
      <p>
        {t(
          'Demo Phase 05 · Venue, kapasitas, verifikasi email, penawaran, dan tindak lanjut menggunakan simulasi lokal.',
        )}
      </p>
    </div>
  );
}
export function InquiryOnlyNotice() {
  const { t } = useI18n();
  return (
    <div className="venue-inquiry-notice">
      <Info size={21} />
      <div>
        <strong>{t('Mulai dari inquiry, lanjutkan dengan kesepakatan')}</strong>
        <p>
          {t(
            'Inquiry dan permintaan booking tidak mengunci ruang. Tidak ada pembayaran atau reservasi terkonfirmasi di tahap ini.',
          )}
        </p>
      </div>
    </div>
  );
}
export function EventSummary({
  query,
  zone,
  service = 'mice',
}: {
  query: EventQuery;
  zone?: string;
  service?: 'mice' | 'wedding';
}) {
  const { t } = useI18n();
  if (service === 'wedding')
    return <WeddingSummary query={query} zone={zone} />;
  return (
    <div className="venue-event-summary">
      <span>
        <MapPin size={16} />
        {LOCATIONS.find((l) => l.id === query.locationId)?.label ??
          query.locationId}
      </span>
      <span>
        <CalendarDays size={16} />
        {query.flexible
          ? t('Tanggal fleksibel')
          : `${query.start} — ${query.end}, ${query.startTime}–${query.endTime}`}
        {zone ? ` · ${zone}` : ''}
      </span>
      <span>
        <UsersRound size={16} />
        {t('{count} peserta', { count: query.participants })} ·{' '}
        {LAYOUT_LABELS[query.layout]}
      </span>
    </div>
  );
}
export function VenueLoading() {
  const { t } = useI18n();
  return (
    <div
      className="venue-loading"
      aria-busy="true"
      aria-label={t('Memuat venue')}
    >
      <span role="status">{t('Menyiapkan pilihan ruang…')}</span>
      {[1, 2, 3].map((n) => (
        <div key={n} className="skeleton h-56 rounded-2xl" />
      ))}
    </div>
  );
}
export function useVenueClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return now;
}
export function VenueErrorPanel({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  const [until] = useState(
    () =>
      Date.now() +
      ((error instanceof VenueError ? error.retryAfter : 0) ?? 0) * 1000,
  );
  const now = useVenueClock();
  const waiting = now
    ? Math.max(0, Math.ceil((until - now) / 1000))
    : error instanceof VenueError
      ? (error.retryAfter ?? 0)
      : 0;
  return (
    <div className="venue-error">
      <Info size={28} />
      <div role="alert">
        <h2>{t('Belum dapat melanjutkan')}</h2>
        <p>{t(error.message)}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} disabled={waiting > 0}>
          {t(waiting ? 'Coba lagi dalam {count} detik' : 'Coba lagi', {
            count: waiting,
          })}
        </Button>
      )}
    </div>
  );
}
export function VenueScenarios({
  value,
  onChange,
}: {
  value: VenueScenario;
  onChange: (v: VenueScenario) => void;
}) {
  const { t } = useI18n();
  return (
    <details className="venue-scenarios">
      <summary>{t('Alat skenario demo')}</summary>
      <label>
        {t('Skenario pengujian')}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as VenueScenario)}
        >
          {VENUE_SCENARIOS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    </details>
  );
}
export function FacilityPoints({
  facilities,
}: {
  facilities: Partial<Record<VenueFacility, boolean | null>>;
}) {
  const { t } = useI18n();
  return (
    <div className="venue-facilities">
      {(Object.keys(FACILITY_LABELS) as VenueFacility[]).map((key) => {
        const Icon = FACILITY_ICONS[key];
        return (
          <span
            key={key}
            className={facilities[key] === true ? '' : 'unavailable'}
          >
            <Icon size={19} />
            <span>
              {t(FACILITY_LABELS[key])}
              {facilities[key] !== true && (
                <small>
                  {t(
                    facilities[key] === false
                      ? 'Tidak termasuk'
                      : 'Belum terverifikasi',
                  )}
                </small>
              )}
            </span>
            {facilities[key] === true && <CheckCircle2 size={14} />}
          </span>
        );
      })}
    </div>
  );
}
export function VenueSteps() {
  const { t } = useI18n();
  return (
    <div className="venue-steps">
      {[
        'Kirim kebutuhan',
        'Verifikasi email',
        'Tinjau penawaran',
        'Ajukan permintaan',
      ].map((text, i) => (
        <span key={text}>
          <b>{i + 1}</b>
          {t(text)}
        </span>
      ))}
    </div>
  );
}
export function ScopeNote() {
  const { t } = useI18n();
  return (
    <p className="venue-inline-note">
      <Clock3 size={17} />
      {t('Ketersediaan dan harga final perlu dikonfirmasi oleh PIC venue.')}
    </p>
  );
}
