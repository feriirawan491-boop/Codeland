'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Presentation,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { venueAdapter } from '@/features/venue/lib/adapter';
import {
  eventParams,
  eventSchema,
  parseEventQuery,
  parseVenueFilters,
  venueScenario,
} from '@/features/venue/lib/query';
import type {
  SpaceResult,
  VenueFilters as Filters,
} from '@/features/venue/lib/types';
import {
  EventSummary,
  InquiryOnlyNotice,
  VenueDemoNotice,
  VenueErrorPanel,
  VenueLoading,
  VenueScenarios,
} from './shared';
import { EventSearchForm } from './event-search-form';
import { SpaceCard } from './space-card';
import { VenueFilters } from './venue-filters';
const DEFAULT = parseVenueFilters(new URLSearchParams());
const PAGE_SIZE = 6;
export function MiceResults() {
  const { t } = useI18n();
  const search = useSearchParams();
  const raw = search.toString();
  const queryKey = eventParams(parseEventQuery(search)).toString();
  const query = useMemo(
    () => parseEventQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const urlFilters = useMemo(
    () => parseVenueFilters(new URLSearchParams(raw)),
    [raw],
  );
  const [pending, setPending] = useState<{
    key: string;
    value: Filters;
  } | null>(null);
  const filters = pending?.key === raw ? pending.value : urlFilters;
  if (pending && pending.key !== raw) setPending(null);
  const scenario = venueScenario(search);
  const [attempt, setAttempt] = useState(0);
  const key = `${queryKey}:${JSON.stringify(filters)}:${scenario}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data?: SpaceResult[];
    error?: Error;
  }>();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keywordDraft, setKeywordDraft] = useState({
    source: raw,
    value: filters.keyword,
  });
  const keyword =
    keywordDraft.source === raw ? keywordDraft.value : filters.keyword;
  const validation = eventSchema.safeParse(query);
  useEffect(() => {
    if (!eventSchema.safeParse(query).success) return;
    const controller = new AbortController();
    venueAdapter
      .searchMeetingSpaces(query, filters, scenario, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [query, filters, scenario, key]);
  useEffect(() => {
    const refresh = () => setAttempt((n) => n + 1);
    window.addEventListener('gobuking:venue-resource-changed', refresh);
    return () =>
      window.removeEventListener('gobuking:venue-resource-changed', refresh);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function change(patch: Partial<Filters>) {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    setPending({ key: raw, value: next });
    const p = eventParams(query);
    if (scenario !== 'ready') p.set('scenario', scenario);
    Object.entries(next).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) p.set(key, value.join(','));
      } else if (
        value !== '' &&
        value !== 0 &&
        !(key === 'page' && value === 1) &&
        !(key === 'sort' && value === 'recommended')
      )
        p.set(key, String(value));
    });
    window.history.pushState(null, '', `/mice?${p}`);
  }
  function reset() {
    setKeywordDraft({ source: raw, value: '' });
    change(DEFAULT);
  }
  const loading = response?.key !== key,
    data = !loading ? (response?.data ?? []) : [],
    error = !loading ? response?.error : undefined;
  const pages = Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    page = Math.min(filters.page, pages);
  const context = {
    setting: filters.setting,
    facilities: filters.facilities.join(','),
    basis: filters.basis,
    maxRate: filters.maxRate ? String(filters.maxRate) : '',
    sort: filters.sort === 'recommended' ? '' : filters.sort,
    keyword: filters.keyword,
    page: filters.page > 1 ? String(filters.page) : '',
  };

  return (
    <main id="main" className="venue-module">
      <section className="venue-results-hero">
        <div className="page-container">
          <nav className="venue-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>MICE</span>
          </nav>
          <div className="venue-hero-title">
            <div>
              <p className="venue-kicker">{t('RUANG UNTUK IDE BESAR')}</p>
              <h1>{t('Pertemuan berkesan, dimulai di sini.')}</h1>
              <p>
                {t(
                  'Temukan ruang yang pas untuk tim, ide, dan momen penting Anda.',
                )}
              </p>
            </div>
            <span className="venue-hero-icon" aria-hidden="true">
              <Presentation size={70} />
            </span>
          </div>
          <EventSummary query={query} />
        </div>
      </section>
      <div className="page-container venue-results-body">
        <div className="venue-search-overlap">
          <EventSearchForm key={queryKey} initial={query} />
        </div>
        <VenueDemoNotice />
        <InquiryOnlyNotice />
        {!validation.success ? (
          <div className="venue-validation" role="alert">
            {t(validation.error.issues[0].message)}
          </div>
        ) : (
          <div className="venue-results-layout">
            <aside className="venue-desktop-filters">
              <VenueFilters value={filters} onChange={change} onReset={reset} />
            </aside>
            <section
              aria-label={t('Hasil ruang meeting')}
              className="venue-results-list"
            >
              <div className="venue-results-heading">
                <div>
                  <h2>{t('Ruang untuk rencana Anda')}</h2>
                  <p aria-live="polite">
                    {t(
                      loading
                        ? 'Mencari ruang…'
                        : '{count} ruang sesuai layout',
                      { count: data.length },
                    )}
                  </p>
                </div>
                <Dialog
                  open={open}
                  onOpenChange={(value) => {
                    if (value) setDraft(filters);
                    setOpen(value);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="venue-mobile-filters" variant="outline">
                      <SlidersHorizontal />
                      {t('Filter')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="venue-module venue-filter-dialog">
                    <DialogTitle className="text-xl font-bold">
                      {t('Filter ruang')}
                    </DialogTitle>
                    <DialogDescription className="mt-2 mb-5">
                      {t(
                        'Filter fasilitas hanya memakai data yang terverifikasi.',
                      )}
                    </DialogDescription>
                    <VenueFilters
                      value={draft}
                      onChange={(patch) =>
                        setDraft((v) => ({ ...v, ...patch }))
                      }
                      onReset={() => setDraft(DEFAULT)}
                    />
                    <Button
                      className="mt-5 w-full"
                      onClick={() => {
                        change({ ...draft, page: 1 });
                        setOpen(false);
                      }}
                    >
                      {t('Terapkan filter')}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="venue-list-tools">
                <label>
                  <Search size={16} />
                  <span className="sr-only">
                    {t('Cari nama ruang atau venue')}
                  </span>
                  <input
                    type="search"
                    aria-label={t('Cari nama ruang atau venue')}
                    value={keyword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setKeywordDraft({ source: raw, value });
                      if (timer.current) clearTimeout(timer.current);
                      timer.current = setTimeout(
                        () => change({ keyword: value }),
                        300,
                      );
                    }}
                  />
                </label>
                <label>
                  <span>{t('Urutkan')}</span>
                  <select
                    aria-label={t('Urutkan')}
                    value={filters.sort}
                    onChange={(e) =>
                      change({ sort: e.target.value as Filters['sort'] })
                    }
                  >
                    <option value="recommended">{t('Rekomendasi')}</option>
                    <option
                      value="price"
                      disabled={!filters.basis || filters.basis === 'quote'}
                    >
                      {t('Tarif terendah, basis sama')}
                    </option>
                  </select>
                </label>
              </div>
              {loading ? (
                <VenueLoading />
              ) : error ? (
                <VenueErrorPanel
                  key={key}
                  error={error}
                  onRetry={() => {
                    const p = new URLSearchParams(raw);
                    p.delete('scenario');
                    window.history.replaceState(null, '', `/mice?${p}`);
                    setAttempt((n) => n + 1);
                  }}
                />
              ) : !data.length ? (
                <div className="venue-empty">
                  <Presentation size={36} />
                  <h2>{t('Belum ada ruang yang sesuai')}</h2>
                  <p>
                    {t(
                      'Coba ubah layout, jumlah peserta, kota, atau fasilitas.',
                    )}
                  </p>
                  <Button variant="outline" onClick={reset}>
                    {t('Hapus semua filter')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="venue-results-grid">
                    {data
                      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                      .map((result) => (
                        <SpaceCard
                          key={result.space.id}
                          result={result}
                          query={query}
                          scenario={scenario}
                          context={context}
                        />
                      ))}
                  </div>
                  {pages > 1 && (
                    <nav
                      className="venue-pagination"
                      aria-label={t('Halaman hasil')}
                    >
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={page === 1}
                        aria-label={t('Halaman sebelumnya')}
                        onClick={() => change({ page: page - 1 })}
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
                        onClick={() => change({ page: page + 1 })}
                      >
                        <ArrowRight />
                      </Button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        )}
        <VenueScenarios
          value={scenario}
          onChange={(value) => {
            const p = new URLSearchParams(raw);
            p.set('scenario', value);
            window.history.pushState(null, '', `/mice?${p}`);
          }}
        />
      </div>
    </main>
  );
}
