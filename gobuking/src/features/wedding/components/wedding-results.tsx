'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
  MapPin,
  Search,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import type {
  WeddingFilters as Filters,
  WeddingResult,
} from '@/features/venue/lib/wedding-types';
import { weddingAdapter } from '../lib/adapter';
import {
  parseWeddingFilters,
  parseWeddingQuery,
  weddingParams,
  weddingLink,
  weddingQuerySchema,
  weddingScenario,
} from '../lib/query';
import {
  VenueLoading,
  VenueErrorPanel,
  VenueScenarios,
} from '@/features/mice/components/shared';
import { WeddingNotice, WeddingScope, WeddingSummary } from './shared';
import { WeddingSearchForm } from './wedding-search-form';
import { WeddingFilters, WEDDING_KIND_LABELS } from './wedding-filters';
const DEFAULT = parseWeddingFilters(new URLSearchParams()),
  PAGE_SIZE = 6;
export function WeddingResults() {
  const { t, locale } = useI18n();
  const search = useSearchParams();
  const raw = search.toString();
  const queryKey = weddingParams(parseWeddingQuery(search)).toString();
  const query = useMemo(
    () => parseWeddingQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const urlFilters = useMemo(
    () => parseWeddingFilters(new URLSearchParams(raw)),
    [raw],
  );
  const [pending, setPending] = useState<{
    key: string;
    value: Filters;
  } | null>(null);
  const filters = pending?.key === raw ? pending.value : urlFilters;
  if (pending && pending.key !== raw) setPending(null);
  const scenario = weddingScenario(search);
  const [attempt, setAttempt] = useState(0);
  const key = `${queryKey}:${JSON.stringify(filters)}:${scenario}:${locale}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data?: WeddingResult[];
    error?: Error;
  }>();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(filters);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!weddingQuerySchema.safeParse(query).success) return;
    const controller = new AbortController();
    weddingAdapter
      .searchWeddingVenues(query, filters, scenario, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [query, filters, scenario, key]);
  useEffect(() => {
    const update = () => setAttempt((value) => value + 1);
    window.addEventListener('gobuking:venue-resource-changed', update);
    return () =>
      window.removeEventListener('gobuking:venue-resource-changed', update);
  }, []);
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
  function update(patch: Partial<Filters>) {
    const source = window.location.search.slice(1),
      current = new URLSearchParams(source),
      base = parseWeddingFilters(current);
    const next = { ...base, ...patch, page: patch.page ?? 1 };
    setPending({ key: raw, value: next });
    const p = weddingParams(parseWeddingQuery(current));
    const currentScenario = weddingScenario(current);
    if (currentScenario !== 'ready') p.set('scenario', currentScenario);
    Object.entries(next).forEach(([key, value]) => {
      if (
        value !== '' &&
        value !== 0 &&
        !(key === 'sort' && value === 'recommended') &&
        !(key === 'page' && value === 1)
      )
        p.set(key, String(value));
    });
    window.history.pushState(null, '', `/wedding?${p}`);
  }
  const valid = weddingQuerySchema.safeParse(query);
  const loading = response?.key !== key;
  const data = loading ? [] : (response?.data ?? []),
    error = !loading ? response?.error : undefined;
  const pages = Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    page = Math.min(filters.page, pages);
  const context = {
    setting: filters.setting,
    kind: filters.kind,
    packageKind: filters.packageKind,
    budget: filters.budget ? String(filters.budget) : '',
    sort: filters.sort === 'recommended' ? '' : filters.sort,
    keyword: filters.keyword,
    page: filters.page > 1 ? String(filters.page) : '',
  };
  return (
    <main id="main" className="venue-module wedding-module">
      <section className="wedding-hero">
        <div className="page-container">
          <nav className="venue-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>{t('Wedding Venue')}</span>
          </nav>
          <div className="wedding-hero-layout">
            <div>
              <p className="venue-kicker">{t('SATU HARI, SEUMUR CERITA')}</p>
              <h1>{t('Tempat istimewa untuk kisah Anda.')}</h1>
              <p>
                {t(
                  'Dari seremoni hangat hingga perayaan besar. Temukan ruang untuk momen yang paling berarti.',
                )}
              </p>
              <WeddingSummary query={query} />
            </div>
            <div className="wedding-hero-photo">
              <Image
                src="/images/wedding-garden.jpg"
                alt={t('Ilustrasi momen pernikahan')}
                fill
                priority
                sizes="(max-width:900px) 90vw, 400px"
                className="object-cover"
              />
              <span>
                <Heart size={18} />
                {t('Awal cerita bersama')}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="page-container wedding-results-body">
        <div className="wedding-search-overlap">
          <WeddingSearchForm key={queryKey} initial={query} />
        </div>
        <WeddingNotice />
        <WeddingScope />
        {!valid.success ? (
          <div role="alert" className="venue-validation">
            {t(valid.error.issues[0].message)}
          </div>
        ) : (
          <div className="venue-results-layout">
            <aside className="venue-desktop-filters">
              <WeddingFilters
                value={filters}
                onChange={update}
                onReset={() => update(DEFAULT)}
              />
            </aside>
            <section
              className="venue-results-list"
              aria-label={t('Pilihan Wedding Venue')}
            >
              <div className="venue-results-heading">
                <div>
                  <h2>{t('Ruang untuk hari bahagia Anda')}</h2>
                  <p aria-live="polite">
                    {t(
                      loading
                        ? 'Mencari venue…'
                        : '{count} area perayaan sesuai pencarian',
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
                    <Button variant="outline" className="venue-mobile-filters">
                      {t('Filter')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="venue-module wedding-module">
                    <DialogTitle className="text-xl font-bold">
                      {t('Filter Wedding Venue')}
                    </DialogTitle>
                    <DialogDescription className="mt-2 mb-4">
                      {t('Sesuaikan suasana, paket, dan anggaran perayaan.')}
                    </DialogDescription>
                    <WeddingFilters
                      value={draft}
                      onChange={(patch) =>
                        setDraft((value) => ({ ...value, ...patch }))
                      }
                      onReset={() => setDraft(DEFAULT)}
                    />
                    <Button
                      className="mt-4 w-full"
                      onClick={() => {
                        update({ ...draft, page: 1 });
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
                    {t('Cari nama venue atau area')}
                  </span>
                  <input
                    ref={input}
                    type="search"
                    aria-label={t('Cari nama venue atau area')}
                    placeholder={t('Cari nama venue atau area')}
                    defaultValue={filters.keyword}
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
                <label>
                  <span>{t('Urutkan')}</span>
                  <select
                    value={filters.sort}
                    aria-label={t('Urutkan')}
                    onChange={(event) =>
                      update({ sort: event.target.value as Filters['sort'] })
                    }
                  >
                    <option value="recommended">{t('Rekomendasi')}</option>
                    <option value="total">
                      {t('Estimasi acara terendah')}
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
                    window.history.replaceState(null, '', `/wedding?${p}`);
                    setAttempt((value) => value + 1);
                  }}
                />
              ) : !data.length ? (
                <div className="venue-empty">
                  <Heart size={34} />
                  <h2>{t('Belum ada venue yang sesuai')}</h2>
                  <p>
                    {t(
                      'Coba ubah jumlah tamu, format, tanggal, atau anggaran Anda.',
                    )}
                  </p>
                  <Button variant="outline" onClick={() => update(DEFAULT)}>
                    {t('Hapus semua filter')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="venue-results-grid">
                    {data
                      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                      .map((result) => {
                        const href = weddingLink(
                          `/wedding/${result.space.slug}`,
                          query,
                          scenario,
                          { ...context, packageId: result.package.id },
                        );
                        return (
                          <article
                            className="wedding-result-card"
                            key={result.space.id}
                          >
                            <Link
                              href={href}
                              className="wedding-card-photo"
                              aria-hidden="true"
                              tabIndex={-1}
                            >
                              <Image
                                src={`/images/${result.photos[0].image}.jpg`}
                                fill
                                sizes="(max-width:767px) 95vw, 420px"
                                alt={t('Ilustrasi area {name}', {
                                  name: result.space.name,
                                })}
                                className="object-cover"
                              />
                              <span>
                                {WEDDING_KIND_LABELS[result.kind]} ·{' '}
                                {t(
                                  result.space.setting === 'outdoor'
                                    ? 'Outdoor'
                                    : 'Indoor',
                                )}
                              </span>
                            </Link>
                            <div className="wedding-card-body">
                              <p>
                                <MapPin size={13} />
                                {result.venue.area}
                              </p>
                              <span className="venue-parent-name">
                                {result.venue.name}
                              </span>
                              <h2>
                                <Link href={href}>{result.space.name}</Link>
                              </h2>
                              <div className="wedding-card-capacity">
                                <span>
                                  <UsersRound size={16} />
                                  {t('Duduk {count}', {
                                    count: result.seated ?? 0,
                                  })}
                                </span>
                                <span>
                                  {t('Berdiri {count}', {
                                    count: result.standing ?? 0,
                                  })}
                                </span>
                              </div>
                              <div className="wedding-card-package">
                                <Heart size={15} />
                                {t(
                                  result.package.wedding?.kind === 'venue-only'
                                    ? 'Sewa venue saja'
                                    : 'Paket perayaan',
                                )}{' '}
                                · {t(result.package.name)}
                              </div>
                              <div className="venue-card-bottom">
                                <div>
                                  <small>
                                    {t(
                                      'Estimasi indikatif untuk {count} tamu',
                                      { count: query.participants },
                                    )}
                                  </small>
                                  <strong>
                                    {result.estimate === null
                                      ? t('Minta penawaran')
                                      : formatRupiah(result.estimate, locale)}
                                  </strong>
                                  <p>
                                    {t(
                                      'Termasuk pajak & layanan · Bukan harga final',
                                    )}
                                  </p>
                                </div>
                                <Button
                                  asChild
                                  size="icon"
                                  aria-label={t('Lihat venue {name}', {
                                    name: result.space.name,
                                  })}
                                >
                                  <Link href={href}>
                                    <ArrowUpRight />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
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
            window.history.pushState(null, '', `/wedding?${p}`);
          }}
        />
      </div>
    </main>
  );
}
