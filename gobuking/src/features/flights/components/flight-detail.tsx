'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Info, Plane, RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import { flightAdapter } from '../lib/adapter';
import {
  flightLink,
  flightParams,
  flightScenario,
  parseFlightQuery,
} from '../lib/query';
import type { FlightOffer } from '../lib/types';
import { FlightTimeline } from './flight-leg';
import {
  FlightBack,
  FlightDemoNotice,
  FlightLoading,
  FlightPrice,
  FlightSummary,
  FreshnessNote,
  SearchOnlyNotice,
  SourceStamp,
  SupplierErrorPanel,
  offerExpired,
  useFlightClock,
} from './shared';
export function FlightDetail({ offerId }: { offerId: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const queryString = flightParams(parseFlightQuery(search)).toString();
  const query = useMemo(
    () => parseFlightQuery(new URLSearchParams(queryString)),
    [queryString],
  );
  const scenario = flightScenario(search);
  const key = `${offerId}:${queryString}:${scenario}:${locale}`;
  const [response, setResponse] = useState<{
    key: string;
    offer?: FlightOffer;
    error?: Error;
    requestId?: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const now = useFlightClock();
  useEffect(() => {
    const controller = new AbortController();
    flightAdapter
      .getFlightOffer(offerId, query, scenario, controller.signal, locale)
      .then((value) =>
        setResponse({ key, offer: value.offer, requestId: value.requestId }),
      )
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [offerId, query, scenario, locale, key]);
  const offer = response?.key === key ? response.offer : undefined;
  const error = response?.key === key ? response.error : undefined;
  const context = Object.fromEntries(
    [
      'airlines',
      'stops',
      'departure',
      'sort',
      'page',
      'outbound',
      'selected',
    ].map((k) => [k, search.get(k) ?? '']),
  );
  const back = flightLink('/flights/results', query, scenario, context);
  async function refresh() {
    setRefreshing(true);
    setRefreshError('');
    try {
      await flightAdapter.refreshFlightSearch(
        query,
        'ready',
        undefined,
        locale,
      );
      router.replace(
        flightLink(`/flights/offers/${offerId}`, query, 'ready', context),
      );
      if (scenario === 'ready') {
        const latest = await flightAdapter.getFlightOffer(
          offerId,
          query,
          'ready',
          undefined,
          locale,
        );
        setResponse({ key, offer: latest.offer, requestId: latest.requestId });
      }
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : 'Supplier belum dapat merespons pencarian.',
      );
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <main id="main" className="flight-module page-container flight-detail">
      <FlightBack href={back} />
      <FlightDemoNotice />
      {!offer && refreshError && (
        <p role="alert" className="field-error">
          {t(refreshError)}
        </p>
      )}
      {!offer ? (
        error ? (
          <SupplierErrorPanel
            key={key}
            error={error}
            onRetry={refresh}
            query={query}
            busy={refreshing}
          />
        ) : (
          <FlightLoading />
        )
      ) : (
        <>
          <div className="flight-detail-heading">
            <div>
              <p className="flight-kicker text-blue-600">
                {t('PERJALANAN DALAM RINCIAN')}
              </p>
              <h1>{t('Itinerary penerbangan Anda')}</h1>
              <FlightSummary query={query} />
            </div>
            <span className="flight-detail-tag">
              <Plane size={17} />
              {t(query.trip === 'roundtrip' ? 'Pulang pergi' : 'Sekali jalan')}
            </span>
          </div>
          <SearchOnlyNotice />
          {offerExpired(offer, now) && (
            <div className="flight-expired-panel" role="status">
              <Info size={23} />
              <div>
                <h2>{t('Penawaran kedaluwarsa')}</h2>
                <p>
                  {t(
                    'Jadwal dan harga ini perlu diperbarui sebelum dibandingkan kembali.',
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="flight-detail-layout">
            <div>
              <FlightTimeline
                leg={offer.outbound}
                label="Penerbangan berangkat"
              />
              {offer.inbound && (
                <FlightTimeline
                  leg={offer.inbound}
                  label="Penerbangan pulang"
                />
              )}
              <section className="flight-fare-conditions">
                <h2>{t('Ketentuan tarif & bagasi')}</h2>
                <ul>
                  {offer.fareConditions.map((condition) => (
                    <li key={condition}>
                      <ShieldCheck size={18} />
                      <span>{t(condition)}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  {t(
                    'Nilai bagasi yang belum tersedia tidak berarti gratis atau sudah termasuk.',
                  )}
                </p>
              </section>
              <section className="flight-source-section">
                <h2>{t('Sumber penawaran')}</h2>
                <SourceStamp offer={offer} />
                <dl>
                  <div>
                    <dt>{t('ID penawaran supplier')}</dt>
                    <dd>{offer.supplierOfferId}</dd>
                  </div>
                  <div>
                    <dt>{t('ID permintaan')}</dt>
                    <dd>{response?.key === key ? response.requestId : ''}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <aside className="flight-detail-summary">
              <span className="flight-summary-icon">
                <Plane />
              </span>
              <h2>{t('Ringkasan perjalanan')}</h2>
              <FlightPrice offer={offer} query={query} />
              <dl className="flight-price-breakdown">
                {[
                  {
                    label: t('{count} dewasa', { count: query.adults }),
                    amount: offer.price.adultTotal,
                  },
                  ...(query.children
                    ? [
                        {
                          label: t('{count} anak', { count: query.children }),
                          amount: offer.price.childTotal,
                        },
                      ]
                    : []),
                  ...(query.infants
                    ? [
                        {
                          label: t('{count} bayi (tanpa kursi)', {
                            count: query.infants,
                          }),
                          amount: offer.price.infantTotal,
                        },
                      ]
                    : []),
                  {
                    label: t('Pajak & biaya wajib'),
                    amount: offer.price.taxesAndFees,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{formatRupiah(row.amount, locale)}</dd>
                  </div>
                ))}
              </dl>
              <div className="flight-summary-notice">
                <Info size={18} />
                <p>
                  {t(
                    'Tiket belum dipesan. Modul ini membantu membandingkan penerbangan saja.',
                  )}
                </p>
              </div>
              <Button
                onClick={refresh}
                disabled={refreshing}
                className="w-full"
              >
                <RefreshCw className={refreshing ? 'animate-spin' : ''} />
                {t(refreshing ? 'Memperbarui…' : 'Perbarui penawaran')}
              </Button>
              {refreshError && (
                <p role="alert" className="field-error">
                  {t(refreshError)}
                </p>
              )}
              <Button variant="outline" asChild className="mt-3 w-full">
                <Link href={back}>
                  <ArrowLeft />
                  {t('Kembali ke hasil')}
                </Link>
              </Button>
              <FreshnessNote />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
