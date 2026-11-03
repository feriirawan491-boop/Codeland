'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Plane,
  SlidersHorizontal,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { flightAdapter } from '../lib/adapter';
import { flightAirport } from '../lib/config';
import { filterFlightOffers } from '../lib/adapter';
import {
  flightLink,
  flightParams,
  flightSchema,
  flightScenario,
  parseFlightFilters,
  parseFlightQuery,
} from '../lib/query';
import type {
  FlightEnvelope,
  FlightFilters as Filters,
  FlightOffer,
  FlightScenario,
} from '../lib/types';
import { FlightSearchForm } from './flight-search-form';
import { FlightFilters } from './flight-filters';
import { FlightOfferCard } from './flight-offer-card';
import {
  FlightDemoNotice,
  FlightLoading,
  FlightPrice,
  FlightScenarios,
  FlightSummary,
  FreshnessNote,
  SearchOnlyNotice,
  SourceStamp,
  SupplierErrorPanel,
  useFlightClock,
  offerExpired,
} from './shared';
const DEFAULT_FILTERS = parseFlightFilters(new URLSearchParams());
const PAGE_SIZE = 5;
export function FlightResults() {
  const { t, locale } = useI18n();
  const search = useSearchParams();
  const raw = search.toString();
  const queryString = flightParams(parseFlightQuery(search)).toString();
  const query = useMemo(
    () => parseFlightQuery(new URLSearchParams(queryString)),
    [queryString],
  );
  const scenario = flightScenario(search);
  const urlFilters = useMemo(
    () => parseFlightFilters(new URLSearchParams(raw)),
    [raw],
  );
  const [pendingFilters, setPendingFilters] = useState<{
    key: string;
    value: Filters;
  } | null>(null);
  const filters =
    pendingFilters?.key === raw ? pendingFilters.value : urlFilters;
  if (pendingFilters && pendingFilters.key !== raw) setPendingFilters(null);
  const outboundId = search.get('outbound') ?? '',
    selectedId = search.get('selected') ?? '';
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${queryString}:${scenario}:${locale}:${attempt}`;
  const validation = flightSchema.safeParse(query);
  const [response, setResponse] = useState<{
    key: string;
    value?: FlightEnvelope;
    error?: Error;
  }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const now = useFlightClock();
  useEffect(() => {
    if (!flightSchema.safeParse(query).success) return;
    const controller = new AbortController();
    const promise = attempt
      ? flightAdapter.refreshFlightSearch(
          query,
          scenario,
          controller.signal,
          locale,
        )
      : flightAdapter.searchFlightOffers(
          query,
          scenario,
          controller.signal,
          locale,
        );
    promise
      .then((value) => setResponse({ key: requestKey, value }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key: requestKey, error });
      });
    return () => controller.abort();
  }, [query, scenario, locale, attempt, requestKey]);
  const loading = response?.key !== requestKey;
  const envelope = !loading ? response?.value : undefined;
  const error = !loading ? response?.error : undefined;
  const [returns, setReturns] = useState<{
    key: string;
    data?: FlightOffer[];
    error?: Error;
  }>();
  const returnKey = `${requestKey}:${outboundId}`;
  useEffect(() => {
    if (!outboundId || query.trip !== 'roundtrip' || !envelope) return;
    const controller = new AbortController();
    flightAdapter
      .getCompatibleReturnOffers(
        outboundId,
        query,
        scenario,
        controller.signal,
        locale,
      )
      .then((value) => setReturns({ key: returnKey, data: value.data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setReturns({ key: returnKey, error });
      });
    return () => controller.abort();
  }, [outboundId, query, scenario, locale, envelope, returnKey]);
  function change(
    patch: Record<string, string | number | undefined>,
    push = true,
  ) {
    const p = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') p.delete(key);
      else p.set(key, String(value));
    });
    const url = `${window.location.pathname}?${p}`;
    if (push) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }
  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    setPendingFilters({ key: raw, value: next });
    change({
      airlines: next.airlines.join(','),
      stops: next.stops === 'all' ? undefined : next.stops,
      departure: next.departure === 'all' ? undefined : next.departure,
      sort: next.sort === 'recommended' ? undefined : next.sort,
      page: next.page === 1 ? undefined : next.page,
      selected: undefined,
    });
  }
  function chooseOutbound(id: string) {
    change({ outbound: id, selected: undefined, page: undefined });
  }
  function scenarioChange(s: FlightScenario) {
    change({
      scenario: s === 'ready' ? undefined : s,
      outbound: undefined,
      selected: undefined,
      page: undefined,
    });
  }
  function retry() {
    if (scenario !== 'ready') scenarioChange('ready');
    setAttempt((n) => n + 1);
  }
  const all = envelope?.data ?? [];
  const selected = all.find(
    (o) => o.id === selectedId && o.outbound.id === outboundId,
  );
  const isReturn = query.trip === 'roundtrip' && !!outboundId;
  const outbound = all.find((o) => o.outbound.id === outboundId);
  const returnLoading = isReturn && returns?.key !== returnKey;
  const inputOffers = isReturn
    ? returns?.key === returnKey
      ? (returns.data ?? [])
      : []
    : query.trip === 'roundtrip'
      ? Array.from(
          new Map(
            all.map((o) => [
              o.outbound.id,
              all
                .filter((v) => v.outbound.id === o.outbound.id)
                .sort((a, b) => a.total - b.total)[0],
            ]),
          ).values(),
        )
      : all;
  const display = filterFlightOffers(
    inputOffers,
    filters,
    isReturn ? 'inbound' : 'outbound',
  );
  const pages = Math.max(1, Math.ceil(display.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = display.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const backContext = {
    airlines: filters.airlines.join(','),
    stops: filters.stops === 'all' ? '' : filters.stops,
    departure: filters.departure === 'all' ? '' : filters.departure,
    sort: filters.sort === 'recommended' ? '' : filters.sort,
    page: filters.page > 1 ? String(filters.page) : '',
    outbound: outboundId,
    selected: selectedId,
  };

  return (
    <main id="main" className="flight-module">
      <section className="flight-results-hero">
        <div className="page-container">
          <nav className="flight-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <Link href="/flights">{t('Penerbangan')}</Link>
          </nav>
          <div className="flight-results-title">
            <div>
              <p className="flight-kicker">
                {t('PILIH WAKTU, TEMUKAN CERITA')}
              </p>
              <h1>
                {t('Penerbangan ke {city}', {
                  city:
                    flightAirport(query.destinationId)?.city ??
                    query.destinationId,
                })}
              </h1>
            </div>
            <Button variant="outline" asChild>
              <Link
                href={flightLink('/flights', query, 'ready', { edit: 'true' })}
              >
                <ArrowLeft />
                {t('Ubah pencarian')}
              </Link>
            </Button>
          </div>
          <FlightSummary query={query} />
        </div>
      </section>
      <div className="page-container flight-results-body">
        <FlightDemoNotice />
        <SearchOnlyNotice />
        {!validation.success ? (
          <section className="flight-invalid">
            <h2>{t('Periksa pencarian penerbangan')}</h2>
            <p role="alert">{t(validation.error.issues[0].message)}</p>
            <FlightSearchForm key={queryString} initial={query} />
          </section>
        ) : (
          <>
            <details className="flight-edit-search">
              <summary>{t('Ubah rute, tanggal, dan penumpang')}</summary>
              <FlightSearchForm key={queryString} initial={query} />
            </details>
            {query.trip === 'roundtrip' && (
              <div
                className="flight-selection-steps"
                aria-label={t('Tahap pilihan pulang pergi')}
              >
                <span className={!isReturn ? 'active' : ''}>
                  <b>1</b>
                  {t('Pilih berangkat')}
                </span>
                <i />
                <span className={isReturn ? 'active' : ''}>
                  <b>2</b>
                  {t('Pilih pulang')}
                </span>
                <i />
                <span className={selected ? 'active' : ''}>
                  <b>3</b>
                  {t('Lihat itinerary')}
                </span>
              </div>
            )}
            {isReturn && outbound && (
              <div className="flight-outbound-selected">
                <Check size={20} />
                <div>
                  <strong>{t('Penerbangan berangkat dipilih')}</strong>
                  <span>
                    {outbound.outbound.segments[0].airline} ·{' '}
                    {outbound.outbound.segments[0].origin.id} →{' '}
                    {outbound.outbound.segments.at(-1)!.destination.id}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    change({
                      outbound: undefined,
                      selected: undefined,
                      page: undefined,
                    })
                  }
                >
                  {t('Ganti berangkat')}
                </Button>
              </div>
            )}
            {selected && (
              <section className="flight-selected-itinerary">
                <div>
                  <strong>{t('Kombinasi perjalanan Anda')}</strong>
                  <p>
                    {t(
                      'Total berasal dari satu penawaran kombinasi yang kompatibel.',
                    )}
                  </p>
                </div>
                <FlightPrice offer={selected} query={query} />
                <Button asChild>
                  <Link
                    href={flightLink(
                      `/flights/offers/${selected.id}`,
                      query,
                      scenario,
                      backContext,
                    )}
                  >
                    {t('Lihat itinerary')}
                    <ArrowRight />
                  </Link>
                </Button>
              </section>
            )}
            <div className="flight-results-layout">
              <aside className="flight-desktop-filters">
                <FlightFilters
                  value={filters}
                  onChange={update}
                  onReset={() => update(DEFAULT_FILTERS)}
                />
              </aside>
              <section
                className="flight-results-list"
                aria-label={t('Hasil penerbangan')}
              >
                <div className="flight-list-toolbar">
                  <div>
                    <h2>
                      {t(
                        isReturn
                          ? 'Pilihan penerbangan pulang'
                          : 'Pilihan penerbangan berangkat',
                      )}
                    </h2>
                    <p aria-live="polite">
                      {!loading && !returnLoading
                        ? t('{count} pilihan sesuai pencarian', {
                            count: display.length,
                          })
                        : t('Mencari penerbangan')}
                    </p>
                  </div>
                  <div className="flight-list-tools">
                    <Dialog
                      open={mobileOpen}
                      onOpenChange={(open) => {
                        if (open) setDraft(filters);
                        setMobileOpen(open);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flight-mobile-filters"
                        >
                          <SlidersHorizontal />
                          {t('Filter')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="flight-filter-dialog">
                        <DialogTitle className="text-xl font-bold">
                          {t('Sesuaikan penerbangan')}
                        </DialogTitle>
                        <DialogDescription className="my-3">
                          {t('Pilih filter lalu terapkan untuk melihat hasil.')}
                        </DialogDescription>
                        <FlightFilters
                          value={draft}
                          onChange={(patch) =>
                            setDraft((v) => ({ ...v, ...patch }))
                          }
                          onReset={() => setDraft(DEFAULT_FILTERS)}
                        />
                        <Button
                          className="mt-5 w-full"
                          onClick={() => {
                            update({ ...draft, page: 1 });
                            setMobileOpen(false);
                          }}
                        >
                          {t('Terapkan filter')}
                        </Button>
                      </DialogContent>
                    </Dialog>
                    <label className="flight-sort">
                      <span>{t('Urutkan')}</span>
                      <select
                        value={filters.sort}
                        onChange={(e) =>
                          update({ sort: e.target.value as Filters['sort'] })
                        }
                      >
                        <option value="recommended">{t('Rekomendasi')}</option>
                        <option value="price">{t('Harga terendah')}</option>
                        <option value="duration">
                          {t('Durasi tersingkat')}
                        </option>
                      </select>
                    </label>
                  </div>
                </div>
                {!!(
                  filters.airlines.length ||
                  filters.stops !== 'all' ||
                  filters.departure !== 'all'
                ) && (
                  <div className="flight-active-filters">
                    <span>{t('Filter aktif')}</span>
                    <button
                      type="button"
                      onClick={() => update(DEFAULT_FILTERS)}
                    >
                      {t('Hapus semua filter')}
                    </button>
                  </div>
                )}
                {loading || returnLoading ? (
                  <FlightLoading />
                ) : error ? (
                  <SupplierErrorPanel
                    key={requestKey}
                    error={error}
                    onRetry={retry}
                    query={query}
                  />
                ) : isReturn && returns?.error ? (
                  <SupplierErrorPanel
                    key={returnKey}
                    error={returns.error}
                    onRetry={retry}
                    query={query}
                  />
                ) : !display.length ? (
                  <div className="flight-empty">
                    <Plane size={32} />
                    <h2>
                      {t(
                        all.length
                          ? 'Tidak ada hasil sesuai filter'
                          : 'Belum ada penerbangan untuk pencarian ini',
                      )}
                    </h2>
                    <p>
                      {t(
                        isReturn && !outbound
                          ? 'Pilihan berangkat tidak ditemukan. Pilih ulang dari hasil pencarian.'
                          : 'Coba ubah tanggal, rute, atau filter pencarian.',
                      )}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        isReturn && !outbound
                          ? change({ outbound: undefined, selected: undefined })
                          : update(DEFAULT_FILTERS)
                      }
                    >
                      {t(
                        isReturn && !outbound
                          ? 'Ganti berangkat'
                          : 'Hapus semua filter',
                      )}
                    </Button>
                    <Link
                      href={flightLink('/flights', query, 'ready', {
                        edit: 'true',
                      })}
                    >
                      {t('Ubah pencarian')}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flight-offers">
                      {visible.map((offer) => (
                        <FlightOfferCard
                          key={offer.id}
                          offer={offer}
                          query={query}
                          scenario={scenario}
                          step={
                            query.trip === 'oneway'
                              ? 'oneway'
                              : isReturn
                                ? 'inbound'
                                : 'outbound'
                          }
                          selected={selected?.id === offer.id}
                          context={backContext}
                          onSelect={() =>
                            isReturn
                              ? change({ selected: offer.id })
                              : chooseOutbound(offer.outbound.id)
                          }
                        />
                      ))}
                    </div>
                    {pages > 1 && (
                      <nav
                        className="flight-pagination"
                        aria-label={t('Halaman hasil')}
                      >
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={page === 1}
                          aria-label={t('Halaman sebelumnya')}
                          onClick={() => update({ page: page - 1 })}
                        >
                          <ArrowLeft />
                        </Button>
                        <span>
                          {t('Halaman {page} dari {pages}', { page, pages })}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={page === pages}
                          aria-label={t('Halaman berikutnya')}
                          onClick={() => update({ page: page + 1 })}
                        >
                          <ArrowRight />
                        </Button>
                      </nav>
                    )}
                    <SourceStamp offer={visible[0]} />
                    {visible.some((o) => offerExpired(o, now)) && (
                      <Button variant="outline" onClick={retry}>
                        <RefreshCw />
                        {t('Perbarui pencarian')}
                      </Button>
                    )}
                    <FreshnessNote />
                  </>
                )}
              </section>
            </div>
          </>
        )}
        <FlightScenarios value={scenario} onChange={scenarioChange} />
      </div>
    </main>
  );
}
