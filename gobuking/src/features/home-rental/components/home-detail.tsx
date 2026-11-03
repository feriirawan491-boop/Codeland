'use client';
import { useEffect, useMemo, useState } from 'react';
import { useInventoryRevision } from '@/hooks/use-inventory-revision';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bath,
  UsersRound,
  House,
  MapPin,
  ShieldCheck,
  UserRound,
  Info,
  LoaderCircle,
  Maximize,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import {
  PropertyGallery,
  PropertyReviews,
} from '@/components/property/property-media';
import {
  HotelSaveButton,
  ReviewScore,
} from '@/features/hotel/components/hotel-card';
import {
  ErrorPanel,
  LoadingCards,
  PriceBreakdown,
  ScenarioControl,
  StaySummary,
} from '@/features/hotel/components/shared';
import { formatRupiah } from '@/lib/utils';
import {
  homeAdapter,
  homeAvailability,
  makeHomeQuote,
  createHomeDraft,
} from '../lib/adapter';
import {
  homeParams,
  parseHomeFilters,
  parseHomeQuery,
  HOME_TYPE_LABELS,
} from '../lib/query';
import type { HomeProperty, HomeQuery } from '../lib/types';
import {
  DepositNotice,
  HomeDemoNotice,
  HomeFacilities,
  HomeRules,
} from './shared';
import { UnitCalendar } from './unit-calendar';
const PropertyMap = dynamic(
  () => import('@/components/property/property-map'),
  { ssr: false, loading: () => <div className="skeleton h-80 rounded-2xl" /> },
);
export function HomeDetail({ slug }: { slug: string }) {
  useInventoryRevision();
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const parsed = useMemo(() => parseHomeQuery(new URLSearchParams(raw)), [raw]);
  const scenario = parseHomeFilters(search).scenario;
  const [response, setResponse] = useState<{
    key: string;
    home?: HomeProperty;
    error?: string;
  }>();
  const key = `${slug}:${scenario}`;
  const home = response?.key === key ? response.home : undefined;
  const error = response?.key === key ? response.error : undefined;
  const [local, setLocal] = useState<{ source: string; query: HomeQuery }>({
    source: raw,
    query: parsed,
  });
  const query = {
    ...(local.source === raw ? local.query : parsed),
    locationId: search.has('locationId')
      ? (local.source === raw ? local.query : parsed).locationId
      : (home?.locationId ?? parsed.locationId),
  } as HomeQuery;
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    homeAdapter
      .getHome(slug, scenario, controller.signal)
      .then((home) => setResponse({ key, home }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error: error.message });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  function changeQuery(next: HomeQuery) {
    setLocal({ source: raw, query: next });
    setActionError('');
  }
  function changeScenario(next: string) {
    const params = homeParams(query);
    params.set('scenario', next);
    router.replace(`/homes/${slug}?${params}`, { scroll: false });
  }
  const invalid = home ? homeAvailability(home, query, scenario) : null;
  const quote = home && !invalid ? makeHomeQuote(home, query, extraIds) : null;
  async function checkout() {
    if (!home || busy || !quote) return;
    setBusy(true);
    setActionError('');
    try {
      const current = await homeAdapter.previewHomeQuote(
        home,
        query,
        extraIds,
        scenario === 'price_changed' ? 'ready' : scenario,
      );
      const draft = createHomeDraft({
        homeId: home.id,
        query,
        extraIds,
        quote: current,
        scenario,
      });
      window.history.replaceState(
        null,
        '',
        `/homes/${slug}?${homeParams(query)}${scenario !== 'ready' ? `&scenario=${scenario}` : ''}`,
      );
      router.push(`/checkout/home/${draft.id}`);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Layanan demo sedang terganggu. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (!home)
    return (
      <main id="main" className="hotel-module home-module page-container py-12">
        <Link className="section-link" href={`/homes?${homeParams(query)}`}>
          <ArrowLeft />
          {t('Kembali ke hasil hunian')}
        </Link>
        {error ? (
          <ErrorPanel message={error} retry={() => changeScenario('ready')} />
        ) : (
          <LoadingCards label="Memuat hunian" />
        )}
      </main>
    );
  return (
    <main id="main" className="hotel-module home-module home-detail">
      <div className="page-container">
        <nav className="hotel-breadcrumb" aria-label={t('Breadcrumb')}>
          <Link href="/">{t('Beranda')}</Link>
          <span>/</span>
          <Link href={`/homes?${homeParams(query)}`}>{t('Home Rental')}</Link>
          <span>/</span>
          <span>{home.name}</span>
        </nav>
        <HomeDemoNotice />
        <div className="hotel-detail-heading">
          <div>
            <span className="home-detail-badge">
              <House size={16} />
              {t('Seluruh hunian')} · {t(HOME_TYPE_LABELS[home.type])}
            </span>
            <h1>{home.name}</h1>
            <p>
              <MapPin size={15} />
              {home.area} · {t('Lokasi perkiraan')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ReviewScore score={home.score} />
            <HotelSaveButton id={home.id} name={home.name} />
          </div>
        </div>
        <PropertyGallery hotel={home} />
        <nav
          className="hotel-anchor-nav"
          aria-label={t('Bagian detail hunian')}
        >
          {[
            ['home-overview', 'Ringkasan'],
            ['home-calendar', 'Kalender'],
            ['home-sleeping', 'Ruang tidur'],
            ['home-facilities', 'Fasilitas'],
            ['home-rules', 'Aturan rumah'],
            ['hotel-reviews', 'Ulasan tamu'],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {t(label)}
            </a>
          ))}
        </nav>
        <div className="hotel-detail-grid">
          <div className="min-w-0">
            <section id="home-overview" className="hotel-detail-section">
              <div className="home-key-facts">
                <span>
                  <UsersRound />
                  {t('Maks. {count} tamu', { count: home.maxGuests })}
                </span>
                <span>
                  <BedDouble />
                  {t('{count} kamar tidur', { count: home.bedrooms })}
                </span>
                <span>
                  <BedDouble />
                  {t('{count} tempat tidur', { count: home.beds })}
                </span>
                <span>
                  <Bath />
                  {t('{count} kamar mandi', { count: home.bathrooms })}
                </span>
                <span>
                  <Maximize />
                  {home.size} m²
                </span>
              </div>
              <h2>{t('Satu hunian, sepenuhnya untuk Anda.')}</h2>
              <p>{t(home.description)}</p>
              <div className="home-host-card">
                <span className="home-host-avatar">
                  <UserRound size={25} />
                </span>
                <div>
                  <h3>{t('Dikelola oleh {name}', { name: home.host.name })}</h3>
                  <span
                    className={
                      home.host.verification === 'demo-reviewed'
                        ? 'home-reviewed'
                        : ''
                    }
                  >
                    <ShieldCheck size={14} />
                    {t(
                      home.host.verification === 'demo-reviewed'
                        ? 'Profil demo ditinjau'
                        : 'Profil demo belum ditinjau',
                    )}
                  </span>
                  <p>{t(home.host.response)}</p>
                </div>
              </div>
            </section>
            <section id="home-sleeping" className="hotel-detail-section">
              <h2>{t('Ruang untuk beristirahat')}</h2>
              <div className="home-sleeping-grid">
                {home.sleeping.map((room) => (
                  <article key={room.name}>
                    <BedDouble size={25} />
                    <h3>{t(room.name)}</h3>
                    <p>{t(room.description)}</p>
                  </article>
                ))}
              </div>
            </section>
            <HomeFacilities home={home} />
            <UnitCalendar
              home={home}
              query={query}
              scenario={scenario}
              onChange={changeQuery}
            />
            <section id="home-guests" className="hotel-detail-section">
              <h2>{t('Siapa yang akan menginap?')}</h2>
              <div className="home-guest-fields">
                <label>
                  {t('Dewasa')}
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={query.adults}
                    onChange={(e) =>
                      changeQuery({ ...query, adults: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  {t('Anak')}
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={query.children}
                    onChange={(e) => {
                      const children = Math.min(
                        8,
                        Math.max(0, Number(e.target.value)),
                      );
                      changeQuery({
                        ...query,
                        children,
                        childAges: Array.from(
                          { length: children },
                          (_, i) => query.childAges[i] ?? '',
                        ),
                      });
                    }}
                  />
                </label>
                {query.childAges.map((age, index) => (
                  <label key={index}>
                    {t('Usia anak {count}', { count: index + 1 })}
                    <select
                      value={age}
                      onChange={(e) =>
                        changeQuery({
                          ...query,
                          childAges: query.childAges.map((age, i) =>
                            i === index ? e.target.value : age,
                          ),
                        })
                      }
                    >
                      <option value="">{t('Pilih usia')}</option>
                      {Array.from({ length: 18 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <p className="home-calendar-policy">
                {t(
                  'Maksimal {count} tamu, termasuk anak. Satu pesanan untuk satu hunian penuh.',
                  { count: home.maxGuests },
                )}
              </p>
            </section>
            <section className="hotel-detail-section">
              <h2>{t('Layanan tambahan (opsional)')}</h2>
              <div className="home-extra-options">
                {home.extras.map((extra) => (
                  <label key={extra.id}>
                    <input
                      type="checkbox"
                      checked={extraIds.includes(extra.id)}
                      onChange={(e) =>
                        setExtraIds(
                          e.target.checked
                            ? [...extraIds, extra.id]
                            : extraIds.filter((id) => id !== extra.id),
                        )
                      }
                    />
                    <span>
                      <strong>{t(extra.label)}</strong>
                      <span>
                        {formatRupiah(extra.amount, locale)} /{' '}
                        {t(extra.basis === 'stay' ? 'kunjungan' : 'malam')}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
            <section id="home-rules" className="hotel-detail-section">
              <h2>{t('Aturan rumah')}</h2>
              <HomeRules home={home} />
              <DepositNotice deposit={home.deposit} />
            </section>
            <section className="hotel-detail-section">
              <h2>{t('Kenali area sekitar')}</h2>
              <p className="home-area-note">
                <MapPin size={18} />
                {home.area} ·{' '}
                {t(
                  'Lokasi yang ditampilkan merupakan area perkiraan, bukan alamat rinci.',
                )}
              </p>
              <PropertyMap
                results={[
                  {
                    id: home.id,
                    name: home.name,
                    coordinates: home.coordinates,
                    total: quote?.total ?? home.nightly,
                  },
                ]}
                selected={null}
                onSelect={() => {}}
                failed={scenario === 'map_error'}
                kind="home"
              />
              <p className="hotel-inline-note">
                <Info size={17} />
                {t(
                  'Instruksi kedatangan hanya tersedia bagi pemesan setelah reservasi terkonfirmasi.',
                )}
              </p>
            </section>
            <PropertyReviews hotel={home} />
          </div>
          <aside className="hotel-reserve-panel home-reserve-panel">
            <span className="home-detail-badge">
              <House size={16} />
              {t('Seluruh hunian')}
            </span>
            <h2>{t('Bawa rencana Anda ke sini.')}</h2>
            <StaySummary query={query} kind="home" />
            {quote ? (
              <PriceBreakdown quote={quote} />
            ) : (
              <div className="home-unavailable" role="status">
                <Info size={19} />
                <span>
                  {t(invalid ?? 'Pilih tanggal untuk melihat harga.')}
                </span>
              </div>
            )}
            <DepositNotice deposit={home.deposit} />
            {actionError && (
              <p className="field-error" role="alert">
                {t(actionError)}
              </p>
            )}
            <Button
              className="w-full"
              disabled={!quote || busy}
              onClick={checkout}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              {t(busy ? 'Memeriksa ketersediaan…' : 'Pesan seluruh hunian')}
            </Button>
            <p className="home-reserve-hint">
              {t(
                'Login atau daftar, isi data tamu, lalu langsung pilih pembayaran. Tidak menunggu persetujuan host.',
              )}
            </p>
          </aside>
        </div>
        <ScenarioControl value={scenario} onChange={changeScenario} />
        <div className="hotel-mobile-reserve">
          <span>
            <small>{t('Total menginap')}</small>
            <strong>
              {quote
                ? formatRupiah(quote.total, locale)
                : t('Periksa tanggal & tamu')}
            </strong>
          </span>
          <Button disabled={!quote || busy} onClick={checkout}>
            {busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
            {t('Lanjutkan')}
          </Button>
        </div>
      </div>
    </main>
  );
}
