'use client';
import { useInventoryRevision } from '@/hooks/use-inventory-revision';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Map,
  List,
  SlidersHorizontal,
  Search,
  X,
  House,
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
import {
  ErrorPanel,
  LoadingCards,
  ScenarioControl,
  StaySummary,
} from '@/features/hotel/components/shared';
import { LOCATIONS } from '@/features/home/lib/search';
import { homeAdapter } from '../lib/adapter';
import {
  HOME_AMENITY_LABELS,
  homeParams,
  parseHomeFilters,
  parseHomeQuery,
} from '../lib/query';
import type { HomeFilters, HomeResult } from '../lib/types';
import { HomeDemoNotice, HomeSearchEditor } from './shared';
import { HomeFilterControls } from './home-filters';
import { HomeCard } from './home-card';
const PropertyMap = dynamic(
  () => import('@/components/property/property-map'),
  { ssr: false, loading: () => <div className="skeleton h-80 rounded-2xl" /> },
);
const PAGE_SIZE = 6;
export function HomeResults() {
  const { t } = useI18n();
  const search = useSearchParams();
  const key = search.toString();
  const query = useMemo(() => parseHomeQuery(new URLSearchParams(key)), [key]);
  const urlFilters = useMemo(
    () => parseHomeFilters(new URLSearchParams(key)),
    [key],
  );
  const [pending, setPending] = useState<{
    key: string;
    value: HomeFilters;
  } | null>(null);
  const filters = pending?.key === key ? pending.value : urlFilters;
  if (pending && pending.key !== key) setPending(null);
  const [response, setResponse] = useState<{
    key: string;
    data?: HomeResult[];
    error?: string;
  }>();
  const [attempt, setAttempt] = useState(0);
  const inventoryRevision = useInventoryRevision();
  const requestKey = `${key}:${attempt}:${inventoryRevision}`;
  const loading = response?.key !== requestKey;
  const results = loading ? [] : (response?.data ?? []);
  const error = !loading ? response?.error : undefined;
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const input = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    homeAdapter
      .searchHomes(query, filters, controller.signal)
      .then((data) => setResponse({ key: requestKey, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key: requestKey, error: error.message });
      });
    return () => controller.abort();
  }, [query, filters, requestKey]);
  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );
  useEffect(() => {
    if (input.current && document.activeElement !== input.current)
      input.current.value = filters.keyword;
  }, [filters.keyword]);
  function update(patch: Partial<HomeFilters>) {
    const next = {
      ...filters,
      ...patch,
      page: patch.page ?? (patch.view ? filters.page : 1),
    };
    const params = homeParams(query);
    Object.entries(next).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(','));
      } else if (typeof value === 'boolean') {
        if (value) params.set(key, 'true');
      } else if (
        value !== '' &&
        value !== 0 &&
        !(key === 'page' && value === 1) &&
        !(key === 'view' && value === 'list') &&
        !(key === 'sort' && value === 'recommended') &&
        !(key === 'scenario' && value === 'ready')
      )
        params.set(key, String(value));
    });
    setPending({ key, value: next });
    window.history.replaceState(null, '', `/homes?${params}`);
  }
  function reset() {
    update({
      ...parseHomeFilters(new URLSearchParams()),
      scenario: filters.scenario,
      view: filters.view,
    });
    if (input.current) input.current.value = '';
  }
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const visible =
    filters.view === 'map'
      ? results
      : results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const location =
    LOCATIONS.find((location) => location.id === query.locationId)?.label ??
    query.locationId;
  const chips = [
    ...(['minBedrooms', 'minBeds', 'minBathrooms'] as const)
      .filter((field) => filters[field] > 0)
      .map((field) => ({
        label: t(
          field === 'minBedrooms'
            ? '{count}+ kamar tidur'
            : field === 'minBeds'
              ? '{count}+ tempat tidur'
              : '{count}+ kamar mandi',
          { count: filters[field] },
        ),
        remove: () => update({ [field]: 0 }),
      })),
    ...filters.amenities.map((amenity) => ({
      label: t(HOME_AMENITY_LABELS[amenity]),
      remove: () =>
        update({ amenities: filters.amenities.filter((a) => a !== amenity) }),
    })),
    ...(filters.pets
      ? [
          {
            label: t('Hewan peliharaan diizinkan'),
            remove: () => update({ pets: false }),
          },
        ]
      : []),
  ];
  function selectPin(id: string) {
    setSelected(id);
    requestAnimationFrame(() =>
      document.getElementById(`home-${id}`)?.focus({ preventScroll: false }),
    );
  }
  return (
    <main id="main" className="hotel-module home-module">
      <div className="hotel-search-banner">
        <div className="page-container">
          <nav className="hotel-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>{t('Home Rental')}</span>
            <span>/</span>
            <span>{location}</span>
          </nav>
          <div className="hotel-search-title">
            <div>
              <p className="hotel-kicker">
                {t('RUANG SENDIRI, CERITA BERSAMA')}
              </p>
              <h1>{t('Temukan hunian di {location}', { location })}</h1>
            </div>
            <Link
              className="hotel-back-link"
              href={`/?service=home&${homeParams(query)}#search`}
            >
              <ArrowLeft size={16} />
              {t('Ubah pencarian')}
            </Link>
          </div>
          <StaySummary query={query} kind="home" />
          <HomeSearchEditor query={query} />
        </div>
      </div>
      <div className="page-container hotel-results-body">
        <HomeDemoNotice />
        <div className="hotel-results-layout">
          <aside className="hotel-desktop-filters">
            <button
              type="button"
              className="hotel-map-preview"
              onClick={() => update({ view: 'map' })}
            >
              <Map size={27} />
              <span>{t('Lihat area di peta')}</span>
            </button>
            <HomeFilterControls
              value={filters}
              onChange={update}
              onReset={reset}
            />
          </aside>
          <section className="min-w-0" aria-label={t('Hasil hunian')}>
            <div className="hotel-results-toolbar">
              <div>
                <h2>
                  {t(
                    loading
                      ? 'Mencari hunian terbaik…'
                      : '{count} pilihan hunian',
                    { count: results.length },
                  )}
                </h2>
                <p>
                  {t(
                    'Seluruh hunian untuk satu rombongan. Harga total sudah termasuk biaya wajib.',
                  )}
                </p>
              </div>
              <div
                className="hotel-view-toggle"
                role="group"
                aria-label={t('Tampilan hasil')}
              >
                <Button
                  variant={filters.view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update({ view: 'list' })}
                >
                  <List />
                  {t('Daftar')}
                </Button>
                <Button
                  variant={filters.view === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update({ view: 'map' })}
                >
                  <Map />
                  {t('Peta')}
                </Button>
              </div>
            </div>
            <div className="hotel-list-tools">
              <label className="hotel-name-search">
                <Search size={16} />
                <span className="sr-only">{t('Cari nama hunian')}</span>
                <input
                  ref={input}
                  type="search"
                  placeholder={t('Cari nama hunian')}
                  defaultValue={filters.keyword}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (debounce.current) clearTimeout(debounce.current);
                    debounce.current = setTimeout(
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
                  onChange={(e) =>
                    update({ sort: e.target.value as HomeFilters['sort'] })
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
                  setMobileOpen(open);
                  if (open) setDraft(filters);
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
                  <DialogTitle>{t('Sesuaikan pilihan hunian')}</DialogTitle>
                  <DialogDescription>
                    {t('Terapkan filter untuk memperbarui hasil pencarian.')}
                  </DialogDescription>
                  <HomeFilterControls
                    value={draft}
                    onChange={(patch) =>
                      setDraft((value) => ({ ...value, ...patch }))
                    }
                    onReset={() =>
                      setDraft({
                        ...parseHomeFilters(new URLSearchParams()),
                        scenario: filters.scenario,
                        view: filters.view,
                      })
                    }
                  />
                  <Button
                    className="sticky bottom-0 w-full"
                    onClick={() => {
                      update({ ...draft, page: 1 });
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
                {chips.map((chip) => (
                  <button type="button" key={chip.label} onClick={chip.remove}>
                    {chip.label}
                    <span className="sr-only">{t('Hapus filter')}</span>
                    <X size={14} />
                  </button>
                ))}
                <button type="button" onClick={reset}>
                  {t('Reset semua')}
                </button>
              </div>
            )}
            {loading ? (
              <LoadingCards label="Memuat hunian" />
            ) : error ? (
              <ErrorPanel
                message={error}
                retry={() => {
                  update({ scenario: 'ready' });
                  setAttempt((n) => n + 1);
                }}
              />
            ) : !results.length ? (
              <div className="hotel-feedback">
                <House size={34} />
                <h2>{t('Belum ada hunian yang sesuai')}</h2>
                <p>
                  {t(
                    'Coba kurangi filter, ubah tanggal, atau pilih destinasi lain.',
                  )}
                </p>
                <Button variant="outline" onClick={reset}>
                  {t('Hapus semua filter')}
                </Button>
                <Link
                  className="section-link"
                  href={`/?service=home&${homeParams(query)}#search`}
                >
                  {t('Ubah pencarian')}
                </Link>
              </div>
            ) : (
              <>
                {filters.view === 'map' && (
                  <PropertyMap
                    results={results.map(({ home, quote }) => ({
                      id: home.id,
                      name: home.name,
                      coordinates: home.coordinates,
                      total: quote.total,
                    }))}
                    selected={selected}
                    kind="home"
                    onSelect={selectPin}
                    failed={filters.scenario === 'map_error'}
                  />
                )}
                <div className="home-results-grid">
                  {visible.map((result) => (
                    <HomeCard
                      key={result.home.id}
                      result={result}
                      query={query}
                      scenario={filters.scenario}
                      selected={selected === result.home.id}
                    />
                  ))}
                </div>
                {filters.view === 'list' && pageCount > 1 && (
                  <nav
                    className="hotel-pagination"
                    aria-label={t('Halaman hasil')}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t('Halaman sebelumnya')}
                      disabled={page === 1}
                      onClick={() => update({ page: page - 1 })}
                    >
                      <ArrowLeft />
                    </Button>
                    {Array.from({ length: pageCount }, (_, i) => (
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
                      aria-label={t('Halaman berikutnya')}
                      disabled={page === pageCount}
                      onClick={() => update({ page: page + 1 })}
                    >
                      <ArrowRight />
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
