'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  List,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LOCATIONS } from '@/features/home/lib/search';
import { hotelAdapter } from '../lib/adapter';
import {
  AMENITY_LABELS,
  hotelParams,
  parseHotelFilters,
  parseHotelQuery,
} from '../lib/query';
import type { HotelFilters, HotelResult } from '../lib/types';
import { HotelResultCard } from './hotel-card';
import { FilterControls } from './filter-controls';
import {
  DemoNotice,
  ErrorPanel,
  HotelSearchEditor,
  LoadingCards,
  ScenarioControl,
  StaySummary,
} from './shared';
const HotelMap = dynamic(() => import('./hotel-map'), {
  ssr: false,
  loading: () => <div className="skeleton h-96 rounded-2xl" />,
});
const PAGE_SIZE = 6;
export function HotelResults() {
  const { t } = useI18n();
  const search = useSearchParams();
  const key = search.toString();
  const query = useMemo(() => parseHotelQuery(new URLSearchParams(key)), [key]);
  const urlFilters = useMemo(
    () => parseHotelFilters(new URLSearchParams(key)),
    [key],
  );
  const [pendingFilters, setPendingFilters] = useState<{
    source: string;
    value: HotelFilters;
  } | null>(null);
  const filters =
    pendingFilters?.source === key ? pendingFilters.value : urlFilters;
  if (pendingFilters && pendingFilters.source !== key) setPendingFilters(null);
  const [response, setResponse] = useState<{
    key: string;
    data?: HotelResult[];
    error?: string;
  }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = response?.key !== key;
  const results = loading ? [] : (response?.data ?? []);
  const error = !loading ? response?.error : undefined;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const visible =
    filters.view === 'map'
      ? results
      : results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    const controller = new AbortController();
    hotelAdapter
      .searchHotels(query, filters, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError')
          setResponse({ key, error: e.message });
      });
    return () => controller.abort();
  }, [key, query, filters]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (input.current && document.activeElement !== input.current)
      input.current.value = filters.keyword;
  }, [filters.keyword]);
  function update(patch: Partial<HotelFilters>) {
    const next = {
      ...filters,
      ...patch,
      page: patch.page ?? (patch.view ? filters.page : 1),
    };
    const params = hotelParams(query);
    Object.entries(next).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        if (value.length) params.set(name, value.join(','));
      } else if (typeof value === 'boolean') {
        if (value) params.set(name, 'true');
      } else if (
        value !== '' &&
        value !== 0 &&
        !(name === 'page' && value === 1) &&
        !(name === 'sort' && value === 'recommended') &&
        !(name === 'view' && value === 'list') &&
        !(name === 'scenario' && value === 'ready')
      )
        params.set(name, String(value));
    });
    setPendingFilters({ source: key, value: next });
    window.history.replaceState(null, '', `/hotels?${params}`);
  }
  function reset() {
    update({
      maxTotal: 0,
      minScore: 0,
      stars: [],
      amenities: [],
      breakfast: false,
      freeCancellation: false,
      propertyType: '',
      keyword: '',
      page: 1,
    });
    if (input.current) input.current.value = '';
  }
  function selectPin(id: string) {
    setSelected(id);
    requestAnimationFrame(() =>
      document.getElementById(`hotel-${id}`)?.focus({ preventScroll: true }),
    );
  }
  const locationName =
    LOCATIONS.find((l) => l.id === query.locationId)?.label ?? query.locationId;
  const chips = [
    ...(filters.breakfast
      ? [
          {
            label: 'Termasuk sarapan',
            clear: () => update({ breakfast: false }),
          },
        ]
      : []),
    ...(filters.freeCancellation
      ? [
          {
            label: 'Bisa dibatalkan gratis',
            clear: () => update({ freeCancellation: false }),
          },
        ]
      : []),
    ...filters.amenities.map((a) => ({
      label: AMENITY_LABELS[a],
      clear: () =>
        update({ amenities: filters.amenities.filter((v) => v !== a) }),
    })),
    ...filters.stars.map((s) => ({
      label: t('{count} bintang', { count: s }),
      clear: () => update({ stars: filters.stars.filter((v) => v !== s) }),
    })),
  ];
  return (
    <main id="main" className="hotel-module">
      <div className="hotel-search-banner">
        <div className="page-container">
          <nav className="hotel-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>{t('Hotel')}</span>
            <span>/</span>
            <span>{locationName}</span>
          </nav>
          <div className="hotel-search-title">
            <div>
              <p className="hotel-kicker">{t('RUANG UNTUK CERITA BARU')}</p>
              <h1>
                {t('Temukan tempat menginap di {location}', {
                  location: locationName,
                })}
              </h1>
            </div>
            <Link
              href={`/?service=hotel&${hotelParams(query)}#search`}
              className="hotel-back-link"
            >
              <ArrowLeft size={16} />
              {t('Ubah pencarian')}
            </Link>
          </div>
          <StaySummary query={query} />
          <HotelSearchEditor
            key={`${query.locationId}-${query.start}-${query.end}-${query.rooms}-${query.children}`}
            query={query}
          />
        </div>
      </div>
      <div className="page-container hotel-results-body">
        <DemoNotice />
        <div className="hotel-results-layout">
          <aside className="hotel-desktop-filters">
            <button
              className="hotel-map-preview"
              type="button"
              onClick={() =>
                update({ view: filters.view === 'map' ? 'list' : 'map' })
              }
            >
              <Map size={28} />
              <span>{t('Lihat area di peta')}</span>
            </button>
            <FilterControls value={filters} onChange={update} onReset={reset} />
          </aside>
          <section className="min-w-0" aria-label={t('Hasil hotel')}>
            <div className="hotel-results-toolbar">
              <div>
                <h2>
                  {loading
                    ? t('Mencari tempat terbaik…')
                    : t('{count} pilihan hotel', { count: results.length })}
                </h2>
                <p>{t('Total harga untuk seluruh durasi dan jumlah kamar.')}</p>
              </div>
              <div
                className="hotel-view-toggle"
                role="group"
                aria-label={t('Tampilan hasil')}
              >
                <Button
                  type="button"
                  size="sm"
                  variant={filters.view === 'list' ? 'default' : 'outline'}
                  onClick={() => update({ view: 'list' })}
                  aria-pressed={filters.view === 'list'}
                >
                  <List />
                  {t('Daftar')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filters.view === 'map' ? 'default' : 'outline'}
                  onClick={() => update({ view: 'map' })}
                  aria-pressed={filters.view === 'map'}
                >
                  <Map />
                  {t('Peta')}
                </Button>
              </div>
            </div>
            <div className="hotel-list-tools">
              <label className="hotel-name-search">
                <Search size={16} />
                <span className="sr-only">{t('Cari nama hotel')}</span>
                <input
                  ref={input}
                  type="search"
                  defaultValue={filters.keyword}
                  placeholder={t('Cari nama hotel')}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (timer.current) clearTimeout(timer.current);
                    timer.current = setTimeout(
                      () => update({ keyword: value }),
                      300,
                    );
                  }}
                />
              </label>
              <label className="hotel-sort">
                <span>{t('Urutkan')}</span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    update({ sort: event.target.value as HotelFilters['sort'] })
                  }
                >
                  <option value="recommended">{t('Rekomendasi')}</option>
                  <option value="price">{t('Total harga terendah')}</option>
                  <option value="rating">{t('Skor tertinggi')}</option>
                </select>
              </label>
              <Dialog
                open={mobileOpen}
                onOpenChange={(open) => {
                  if (open) setDraftFilters(filters);
                  setMobileOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="hotel-mobile-filter-trigger"
                  >
                    <SlidersHorizontal />
                    {t('Filter')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="hotel-filter-dialog">
                  <DialogTitle className="text-xl font-bold">
                    {t('Sesuaikan pilihan Anda')}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm text-muted-foreground">
                    {t('Terapkan filter untuk memperbarui hasil pencarian.')}
                  </DialogDescription>
                  <FilterControls
                    value={draftFilters}
                    onChange={(patch) =>
                      setDraftFilters((f) => ({ ...f, ...patch }))
                    }
                    onReset={() =>
                      setDraftFilters({
                        ...parseHotelFilters(new URLSearchParams()),
                        scenario: filters.scenario,
                      })
                    }
                  />
                  <Button
                    className="sticky bottom-0 w-full"
                    onClick={() => {
                      update({ ...draftFilters, page: 1 });
                      setMobileOpen(false);
                    }}
                  >
                    {t('Terapkan filter')}
                    <ArrowRight />
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            {chips.length > 0 && (
              <div className="hotel-active-filters">
                {chips.map((chip, index) => (
                  <button
                    type="button"
                    key={`${chip.label}-${index}`}
                    onClick={chip.clear}
                  >
                    {t(chip.label)}
                    <X size={13} />
                    <span className="sr-only">{t('Hapus filter')}</span>
                  </button>
                ))}
                <button type="button" onClick={reset}>
                  {t('Reset semua')}
                </button>
              </div>
            )}
            {loading ? (
              <LoadingCards />
            ) : error ? (
              <ErrorPanel
                message={error}
                retry={() => update({ scenario: 'ready' })}
              />
            ) : !results.length ? (
              <div className="hotel-feedback">
                <Search size={32} />
                <h2>{t('Belum ada hotel yang sesuai')}</h2>
                <p>
                  {t(
                    'Coba kurangi filter, ubah tanggal, atau pilih destinasi lain.',
                  )}
                </p>
                <Button variant="outline" onClick={reset}>
                  {t('Hapus semua filter')}
                </Button>
                <Link
                  href={`/?service=hotel&${hotelParams(query)}#search`}
                  className="section-link"
                >
                  {t('Ubah tanggal')}
                </Link>
              </div>
            ) : (
              <>
                {filters.view === 'map' && (
                  <HotelMap
                    results={results}
                    selected={selected}
                    onSelect={selectPin}
                    failed={filters.scenario === 'map_error'}
                  />
                )}
                <div className="hotel-result-list">
                  {visible.map((result) => (
                    <HotelResultCard
                      key={result.hotel.id}
                      result={result}
                      query={query}
                      scenario={filters.scenario}
                      selected={selected === result.hotel.id}
                    />
                  ))}
                </div>
                {filters.view === 'list' && totalPages > 1 && (
                  <nav
                    className="hotel-pagination"
                    aria-label={t('Halaman hasil')}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      aria-label={t('Halaman sebelumnya')}
                      onClick={() => update({ page: page - 1 })}
                    >
                      <ChevronLeft />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? 'default' : 'outline'}
                        aria-label={t('Halaman {number}', { number: i + 1 })}
                        aria-current={page === i + 1 ? 'page' : undefined}
                        onClick={() => update({ page: i + 1 })}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === totalPages}
                      aria-label={t('Halaman berikutnya')}
                      onClick={() => update({ page: page + 1 })}
                    >
                      <ChevronRight />
                    </Button>
                  </nav>
                )}
              </>
            )}
            <ScenarioControl
              value={filters.scenario}
              onChange={(scenario) => update({ scenario })}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
