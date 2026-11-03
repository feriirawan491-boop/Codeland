'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plane, ArrowUpRight, Route, Clock3, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { parseFlightQuery } from '../lib/query';
import { FlightSearchForm } from './flight-search-form';
import { FlightResults } from './flight-results';
import { FlightDemoNotice, SearchOnlyNotice } from './shared';
export function FlightEntry() {
  const search = useSearchParams();
  const { t } = useI18n();
  if (search.has('start') && search.get('edit') !== 'true')
    return <FlightResults />;
  return (
    <main id="main" className="flight-module">
      <section className="flight-search-hero">
        <div className="page-container">
          <nav className="flight-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>{t('Penerbangan')}</span>
          </nav>
          <div className="flight-landing-title">
            <div>
              <p className="flight-kicker">{t('JARAK BARU, CERITA BARU')}</p>
              <h1>{t('Langkah berikutnya, terbang.')}</h1>
              <p>
                {t(
                  'Bandingkan rute, waktu, dan harga. Temukan perjalanan yang pas untuk Anda.',
                )}
              </p>
            </div>
            <div className="flight-hero-art" aria-hidden="true">
              <span>CGK</span>
              <div>
                <i />
                <Plane />
              </div>
              <span>DPS</span>
              <small>
                WIB → WITA <ArrowUpRight size={17} />
              </small>
            </div>
          </div>
        </div>
      </section>
      <div className="page-container flight-landing-body">
        <FlightSearchForm
          initial={
            search.has('locationId') ? parseFlightQuery(search) : undefined
          }
        />
        <FlightDemoNotice />
        <SearchOnlyNotice />
        <div className="flight-value-grid">
          {[
            {
              icon: Route,
              title: 'Satu rute, banyak pilihan',
              text: 'Bandingkan penerbangan langsung dan transit dalam satu tampilan.',
            },
            {
              icon: Clock3,
              title: 'Waktu lokal yang jelas',
              text: 'Lihat zona waktu dan pergantian hari pada setiap segmen.',
            },
            {
              icon: ShieldCheck,
              title: 'Total biaya transparan',
              text: 'Harga utama mencakup seluruh penumpang, pajak, dan biaya wajib.',
            },
          ].map((item) => (
            <article key={item.title}>
              <item.icon size={24} />
              <h2>{t(item.title)}</h2>
              <p>{t(item.text)}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
