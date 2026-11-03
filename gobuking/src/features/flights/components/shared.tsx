'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Plane,
  Info,
  FlaskConical,
  RefreshCw,
  ArrowLeft,
  Clock3,
  WifiOff,
  TriangleAlert,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import { flightAirport, FLIGHT_SCENARIOS } from '../lib/config';
import { FlightError } from '../lib/adapter';
import { flightLink } from '../lib/query';
import type { FlightOffer, FlightQuery, FlightScenario } from '../lib/types';
export function SearchOnlyNotice() {
  const { t } = useI18n();
  return (
    <div className="flight-search-only">
      <Info size={20} />
      <div>
        <strong>{t('Pencarian saja, belum termasuk pemesanan tiket')}</strong>
        <p>
          {t(
            'Jadwal dan harga pada demo ini adalah simulasi. Tidak ada pembayaran, PNR, e-ticket, atau jaminan kursi.',
          )}
        </p>
      </div>
    </div>
  );
}
export function FlightDemoNotice() {
  const { t } = useI18n();
  return (
    <div className="flight-demo">
      <FlaskConical size={16} />
      <p>
        {t(
          'Demo Phase 04 · Data penerbangan sintetis dari Gobuking Flight Sandbox, bukan supplier live.',
        )}
      </p>
    </div>
  );
}
export function FlightSummary({ query }: { query: FlightQuery }) {
  const { t, locale } = useI18n();
  const origin = flightAirport(query.locationId),
    dest = flightAirport(query.destinationId);
  const date = (value: string) =>
    Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(`${value}T12:00:00Z`))
      : value;
  return (
    <div className="flight-summary">
      <span>
        <Plane size={16} />
        {origin?.city ?? query.locationId} ({query.locationId}) →{' '}
        {dest?.city ?? query.destinationId} ({query.destinationId})
      </span>
      <span>
        {date(query.start)}
        {query.trip === 'roundtrip' && query.end ? ` — ${date(query.end)}` : ''}
      </span>
      <span>
        {t('{count} penumpang', {
          count: query.adults + query.children + query.infants,
        })}{' '}
        · {t(query.cabin === 'business' ? 'Bisnis' : 'Ekonomi')}
      </span>
    </div>
  );
}
export function Duration({ minutes }: { minutes: number }) {
  const { t } = useI18n();
  return (
    <>
      {t('{hours}j {minutes}m', {
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60,
      })}
    </>
  );
}
export function useFlightClock() {
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
export function offerExpired(offer: FlightOffer, now: number) {
  return !!offer.expiresAt && Date.parse(offer.expiresAt) <= now;
}
export function SourceStamp({ offer }: { offer: FlightOffer }) {
  const { t, locale } = useI18n();
  const now = useFlightClock();
  const time = (value: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
  return (
    <div className="flight-source">
      <span>
        {offer.source} · {t('Simulasi')}
      </span>
      <span>{t('Diambil {time} WIB', { time: time(offer.fetchedAt) })}</span>
      <span className={offerExpired(offer, now) ? 'is-expired' : ''}>
        {offer.expiresAt
          ? t(
              offerExpired(offer, now)
                ? 'Penawaran kedaluwarsa'
                : 'Berlaku sampai {time} WIB',
              { time: time(offer.expiresAt) },
            )
          : t('Masa berlaku tidak diberikan. Harga dapat berubah.')}
      </span>
    </div>
  );
}
export function FlightLoading() {
  const { t } = useI18n();
  return (
    <div
      aria-busy="true"
      aria-label={t('Mencari penerbangan')}
      className="flight-loading"
    >
      <p role="status">{t('Sedang mencari jadwal dan penawaran…')}</p>
      {[1, 2, 3].map((n) => (
        <div key={n} className="skeleton h-48 rounded-2xl" />
      ))}
    </div>
  );
}
export function SupplierErrorPanel({
  error,
  onRetry,
  query,
  busy = false,
}: {
  error: Error;
  onRetry: () => void;
  query: FlightQuery;
  busy?: boolean;
}) {
  const { t } = useI18n();
  const flightError = error instanceof FlightError ? error : null;
  const [until] = useState(
    () => Date.now() + (flightError?.retryAfter ?? 0) * 1000,
  );
  const now = useFlightClock();
  const wait = now
    ? Math.max(0, Math.ceil((until - now) / 1000))
    : (flightError?.retryAfter ?? 0);
  return (
    <div className="flight-error">
      <span className="flight-feedback-icon">
        {flightError?.code === 'OFFLINE' ? <WifiOff /> : <TriangleAlert />}
      </span>
      <div role="alert" className="flight-error-message">
        <h2>{t('Pencarian belum dapat diselesaikan')}</h2>
        <p>{t(error.message)}</p>
      </div>
      <div className="flight-error-actions">
        <Button onClick={onRetry} disabled={wait > 0 || busy}>
          <RefreshCw />
          {t(wait > 0 ? 'Coba lagi dalam {count} detik' : 'Coba lagi', {
            count: wait,
          })}
        </Button>
        <Button asChild variant="outline">
          <Link href={flightLink('/flights', query, 'ready', { edit: 'true' })}>
            {t('Ubah pencarian')}
          </Link>
        </Button>
      </div>
      <small>
        {t('Kode respons')}: {flightError?.code ?? 'ERROR'}
      </small>
    </div>
  );
}
export function FlightPrice({
  offer,
  query,
}: {
  offer: FlightOffer;
  query: FlightQuery;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flight-price">
      <small>
        {t('Total {count} penumpang', {
          count: query.adults + query.children + query.infants,
        })}
        {offer.inbound ? ` · ${t('Pulang pergi')}` : ''}
      </small>
      <strong>{formatRupiah(offer.total, locale)}</strong>
      <span>{t('Termasuk pajak dan biaya wajib')}</span>
    </div>
  );
}
export function FlightScenarios({
  value,
  onChange,
}: {
  value: FlightScenario;
  onChange: (s: FlightScenario) => void;
}) {
  const { t } = useI18n();
  return (
    <details className="flight-scenarios">
      <summary>{t('Alat skenario demo')}</summary>
      <label>
        {t('Skenario pengujian')}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as FlightScenario)}
        >
          {FLIGHT_SCENARIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
export function FlightBack({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <Link href={href} className="flight-back">
      <ArrowLeft size={17} />
      {t('Kembali ke hasil penerbangan')}
    </Link>
  );
}
export function FreshnessNote() {
  const { t } = useI18n();
  return (
    <p className="flight-freshness">
      <Clock3 size={16} />
      {t(
        'Harga dapat berubah. Memilih penerbangan tidak menahan kursi atau membuat reservasi.',
      )}
    </p>
  );
}
