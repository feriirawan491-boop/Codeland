'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Search,
  CarFront,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { carAdapter } from '../lib/adapter';
import {
  carLink,
  carParams,
  parseCarFilters,
  parseCarQuery,
  carScenario,
} from '../lib/query';
import { CAR_SCENARIOS } from '../lib/config';
import type { CarFilters as Filters, CarResult } from '../lib/types';
import { CarSearchForm } from './car-search-form';
import { CarFilters } from './car-filters';
import {
  CarErrorPanel,
  CarLoading,
  CarNotice,
  CarFacts,
  CarMedia,
  CarPrice,
  CarSummary,
} from './shared';
const PAGE_SIZE = 6;
const DEFAULT = parseCarFilters(new URLSearchParams());
export function CarResults({ results = false }: { results?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const qKey = carParams(parseCarQuery(search)).toString();
  const query = useMemo(() => parseCarQuery(new URLSearchParams(qKey)), [qKey]);
  const filters = useMemo(
    () => parseCarFilters(new URLSearchParams(raw)),
    [raw],
  );
  const scenario = carScenario(search);
  const showResults = results || search.has('start');
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([query, filters, scenario, locale, attempt]);
  const [response, setResponse] = useState<{
    key: string;
    data?: CarResult[];
    error?: Error;
  }>();
  const [filterOpen, setFilterOpen] = useState(false),
    [draft, setDraft] = useState(filters);
  const [keyword, setKeyword] = useState<{ key: string; value: string }>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!showResults) return;
    const controller = new AbortController();
    carAdapter
      .searchRentalOffers(query, filters, scenario, controller.signal)
      .then((data) => setResponse({ key, data }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [query, filters, scenario, locale, key, showResults]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function update(patch: Partial<Filters>) {
    const p = new URLSearchParams(window.location.search);
    const next = {
      ...parseCarFilters(p),
      ...patch,
      page: 'page' in patch ? patch.page! : 1,
    };
    for (const [name, value] of Object.entries(next)) {
      if (
        value === '' ||
        value === 0 ||
        value === 'recommended' ||
        (name === 'page' && value === 1)
      )
        p.delete(name);
      else p.set(name, String(value));
    }
    router.replace(`/cars/results?${p}`, { scroll: false });
  }
  const loading = response?.key !== key,
    data = loading ? [] : (response.data ?? []),
    error = loading ? undefined : response.error;
  const pages = Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    page = Math.min(filters.page, pages);
  const context = Object.fromEntries(
    Object.entries(filters).map(([k, v]) => [k, String(v)]),
  );
  return (
    <main id="main" className="car-module">
      <section className="car-hero">
        <div className="page-container">
          <nav className="car-breadcrumb" aria-label={t('Breadcrumb')}>
            <Link href="/">{t('Beranda')}</Link>
            <span>/</span>
            <span>{t('Rental Mobil')}</span>
          </nav>
          <div className="car-hero-grid">
            <div>
              <p className="car-kicker">{t('JALAN BARU, CERITA BARU')}</p>
              <h1>{t('Pergi lebih jauh. Senyaman rencana Anda.')}</h1>
              <p>
                {t(
                  'Bersama pengemudi atau di balik kemudi sendiri. Temukan kendaraan yang pas untuk perjalanan Anda.',
                )}
              </p>
              <div className="car-hero-chips">
                <span>
                  <CarFront size={17} />
                  {t('Pilihan sesuai rombongan')}
                </span>
                <span>
                  <ShieldCheck size={17} />
                  {t('Syarat jelas sebelum bayar')}
                </span>
              </div>
            </div>
            <div className="car-hero-photo">
              <Image
                src="/images/car-suv.jpg"
                alt={t('Ilustrasi perjalanan dengan kendaraan SUV')}
                fill
                priority
                sizes="(max-width:900px) 90vw, 420px"
                className="object-cover"
              />
              <span>
                <MapPin size={16} />
                {t('Mulai perjalanan Anda')}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="page-container car-body">
        <div className="car-search-overlap">
          <CarSearchForm key={qKey} initial={query} />
        </div>
        <CarNotice />
        {!showResults ? (
          <>
            <div className="car-intro">
              <div>
                <p className="car-kicker">{t('KENALI PILIHAN ANDA')}</p>
                <h2>{t('Dua cara menikmati perjalanan.')}</h2>
              </div>
              <p>
                {t(
                  'Pilih mode, atur jadwal, lalu tinjau kendaraan dan syarat mitranya. Pembayaran tersedia setelah permintaan disetujui.',
                )}
              </p>
            </div>
            <div className="car-mode-explainer">
              {(
                [
                  {
                    mode: 'driver',
                    title: 'Duduk nyaman, nikmati perjalanan.',
                    body: 'Paket 12 jam dengan pengemudi dan BBM dalam area layanan. Tol serta parkir dibahas terpisah.',
                  },
                  {
                    mode: 'self',
                    title: 'Kendalikan perjalanan Anda sendiri.',
                    body: 'Paket lepas kunci 24 jam. SIM, usia, verifikasi, dan deposit mengikuti kebijakan mitra.',
                  },
                ] as const
              ).map((item) => (
                <section key={item.mode}>
                  <CarFront size={28} />
                  <h3>{t(item.title)}</h3>
                  <p>{t(item.body)}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.replace(
                        carLink('/cars', { ...query, mode: item.mode }),
                      );
                      document.getElementById('car-locationId')?.focus();
                    }}
                  >
                    {t(
                      item.mode === 'driver'
                        ? 'Pilih dengan pengemudi'
                        : 'Pilih lepas kunci',
                    )}
                    <ArrowRight size={16} />
                  </Button>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="car-results-layout">
            <aside className="car-desktop-filters">
              <CarFilters
                value={filters}
                onChange={update}
                onReset={() => update(DEFAULT)}
              />
            </aside>
            <section className="car-results-content" aria-busy={loading}>
              <div className="car-results-heading">
                <div>
                  <h2>{t('Kendaraan untuk rencana Anda')}</h2>
                  <p role="status">
                    {t(
                      loading
                        ? 'Mencari rental…'
                        : '{count} paket sesuai pencarian',
                      { count: data.length },
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="car-mobile-filter"
                  onClick={(event) => {
                    filterTrigger.current = event.currentTarget;
                    setDraft(filters);
                    setFilterOpen(true);
                  }}
                >
                  <SlidersHorizontal size={17} />
                  {t('Filter')}
                </Button>
              </div>
              <CarSummary query={query} />
              <div className="car-toolbar">
                <label>
                  <Search size={17} />
                  <input
                    type="search"
                    aria-label={t('Cari kendaraan atau penyedia')}
                    placeholder={t('Cari kendaraan atau penyedia')}
                    value={
                      keyword?.key === raw ? keyword.value : filters.keyword
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setKeyword({ key: raw, value });
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
                    aria-label={t('Urutkan')}
                    value={filters.sort}
                    onChange={(e) =>
                      update({ sort: e.target.value as Filters['sort'] })
                    }
                  >
                    <option value="recommended">{t('Rekomendasi')}</option>
                    <option value="total">{t('Total harga terendah')}</option>
                  </select>
                </label>
              </div>
              {loading ? (
                <CarLoading />
              ) : error ? (
                <CarErrorPanel
                  key={key}
                  error={error}
                  onRetry={() => setAttempt((v) => v + 1)}
                />
              ) : !data.length ? (
                <div className="car-empty">
                  <CarFront size={38} />
                  <h3>{t('Belum ada mobil yang sesuai')}</h3>
                  <p>
                    {t(
                      'Coba ubah jadwal, mode, kapasitas, atau anggaran Anda.',
                    )}
                  </p>
                  <Button variant="outline" onClick={() => update(DEFAULT)}>
                    {t('Hapus semua filter')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="car-result-grid">
                    {data
                      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                      .map((result) => {
                        const href = carLink(
                          `/cars/${result.offer.id}`,
                          query,
                          scenario,
                          context,
                        );
                        return (
                          <article
                            className="car-result-card"
                            key={result.offer.id}
                          >
                            <Link
                              href={href}
                              tabIndex={-1}
                              aria-hidden="true"
                              className="car-result-photo"
                            >
                              <CarMedia offer={result.offer} />
                              <span>
                                {t(
                                  result.offer.mode === 'driver'
                                    ? 'Dengan pengemudi'
                                    : 'Tanpa pengemudi',
                                )}{' '}
                                ·{' '}
                                {t('Paket {hours} jam', {
                                  hours: result.offer.unitHours,
                                })}
                              </span>
                            </Link>
                            <div className="car-result-card-body">
                              <p className="car-provider">
                                {result.offer.providerName} · DEMO
                              </p>
                              <h3>
                                <Link href={href}>{result.offer.name}</Link>
                              </h3>
                              <CarFacts offer={result.offer} />
                              <CarPrice
                                quote={result.quote}
                                offer={result.offer}
                              />
                              {!result.available && (
                                <p className="car-warning">
                                  {t(result.reason ?? 'Armada belum tersedia.')}
                                </p>
                              )}
                              <Button asChild className="w-full">
                                <Link
                                  href={href}
                                  aria-label={t('Lihat paket {name}', {
                                    name: result.offer.name,
                                  })}
                                >
                                  {t('Lihat paket')}
                                  <ArrowRight size={17} />
                                </Link>
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                  <nav
                    className="car-pagination"
                    aria-label={t('Halaman hasil rental')}
                  >
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={page <= 1}
                      aria-label={t('Halaman sebelumnya')}
                      onClick={() => update({ page: page - 1 })}
                    >
                      <ArrowLeft size={18} />
                    </Button>
                    <span>
                      {t('Halaman {page} dari {pages}', { page, pages })}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={page >= pages}
                      aria-label={t('Halaman berikutnya')}
                      onClick={() => update({ page: page + 1 })}
                    >
                      <ArrowRight size={18} />
                    </Button>
                  </nav>
                </>
              )}
            </section>
          </div>
        )}
        <details className="car-demo-tools">
          <summary>{t('Alat skenario demo')}</summary>
          <label>
            <span>{t('Skenario rental')}</span>
            <select
              aria-label={t('Skenario rental')}
              value={scenario}
              onChange={(e) => {
                const p = new URLSearchParams(raw);
                p.set('scenario', e.target.value);
                router.replace(`/cars/results?${p}`);
              }}
            >
              {CAR_SCENARIOS.filter(
                (s) =>
                  ![
                    'mutation_timeout',
                    'unauthorized',
                    'forbidden',
                    'price_changed',
                    'quote_expired',
                  ].includes(s),
              ).map((s) => (
                <option value={s} key={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </details>
      </div>
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent
          className="car-module car-filter-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            filterTrigger.current?.focus();
          }}
        >
          <DialogTitle>{t('Filter rental mobil')}</DialogTitle>
          <DialogDescription>
            {t('Sesuaikan kapasitas, transmisi, penyedia, dan total harga.')}
          </DialogDescription>
          <CarFilters
            value={draft}
            onChange={(patch) => setDraft((v) => ({ ...v, ...patch }))}
            onReset={() => setDraft(DEFAULT)}
          />
          <Button
            className="w-full"
            onClick={() => {
              update(draft);
              setFilterOpen(false);
            }}
          >
            {t('Terapkan filter')}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
