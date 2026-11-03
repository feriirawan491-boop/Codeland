'use client';
import { SavePropertyButton } from '@/components/shared/save-property-button';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Heart,
  Info,
  MapPin,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { packageEstimate } from '@/features/venue/lib/pricing';
import { spaceAvailable } from '@/features/venue/lib/resources';
import {
  FacilityPoints,
  VenueLoading,
  VenueErrorPanel,
} from '@/features/mice/components/shared';
import { weddingAdapter } from '../lib/adapter';
import {
  parseWeddingQuery,
  weddingParams,
  weddingLink,
  weddingScenario,
  weddingQuerySchema,
} from '../lib/query';
import { WeddingGallery } from './wedding-gallery';
import {
  WeddingNotice,
  WeddingScope,
  WeddingSummary,
  WeddingPackageScope,
} from './shared';
import { WeddingSearchForm } from './wedding-search-form';
export function WeddingDetail({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const raw = search.toString();
  const scenario = weddingScenario(search),
    key = `${slug}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    value?: Awaited<ReturnType<typeof weddingAdapter.getWeddingVenue>>;
    error?: Error;
  }>();
  const queryKey = weddingParams(parseWeddingQuery(search)).toString();
  const parsed = useMemo(
    () => parseWeddingQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const [revision, setRevision] = useState(0);
  void revision;
  useEffect(() => {
    const controller = new AbortController();
    weddingAdapter
      .getWeddingVenue(slug, scenario, controller.signal)
      .then((value) => setResponse({ key, value }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  useEffect(() => {
    const update = () => setRevision((value) => value + 1);
    window.addEventListener('gobuking:venue-resource-changed', update);
    return () =>
      window.removeEventListener('gobuking:venue-resource-changed', update);
  }, []);
  const data = response?.key === key ? response.value : undefined,
    error = response?.key === key ? response.error : undefined;
  const query = {
    ...parsed,
    locationId: search.has('locationId')
      ? parsed.locationId
      : (data?.venue.locationId ?? parsed.locationId),
  };
  const context = Object.fromEntries(
    ['setting', 'kind', 'packageKind', 'budget', 'sort', 'keyword', 'page'].map(
      (key) => [key, search.get(key) ?? ''],
    ),
  );
  const back = weddingLink('/wedding', query, scenario, context);
  if (!data)
    return (
      <main
        id="main"
        className="venue-module wedding-module page-container py-8"
      >
        <Link className="venue-back" href={back}>
          <ArrowLeft size={17} />
          {t('Kembali ke Wedding Venue')}
        </Link>
        {error ? (
          <VenueErrorPanel
            key={key}
            error={error}
            onRetry={() =>
              router.replace(weddingLink(`/wedding/${slug}`, query))
            }
          />
        ) : (
          <VenueLoading />
        )}
      </main>
    );
  const { space, venue } = data;
  const pack =
    space.packages.find((pack) => pack.id === search.get('packageId')) ??
    space.packages[0];
  const validation = weddingQuerySchema.safeParse(query);
  const fits = (space.capacity[query.layout] ?? 0) >= query.participants;
  const valid =
    validation.success &&
    fits &&
    spaceAvailable(space, query, venue) &&
    scenario !== 'blocked' &&
    query.locationId === venue.locationId;
  const estimate = validation.success ? packageEstimate(pack, query) : null;
  const inquiry = weddingLink(
      `/wedding/${space.slug}/inquiry`,
      query,
      scenario,
      { packageId: pack.id },
    ),
    request = weddingLink(`/wedding/${space.slug}/request`, query, scenario, {
      packageId: pack.id,
    });
  return (
    <main
      id="main"
      className="venue-module wedding-module page-container wedding-detail"
    >
      <Link className="venue-back" href={back}>
        <ArrowLeft size={17} />
        {t('Kembali ke Wedding Venue')}
      </Link>
      <WeddingNotice />
      <div className="wedding-detail-heading">
        <div>
          <p className="venue-parent-name">{venue.name}</p>
          <h1>{space.name}</h1>
          <SavePropertyButton id={`wedding:${space.id}`} />
          <p>
            <MapPin size={16} />
            {venue.area} · {venue.zone}
          </p>
        </div>
        <span>
          <Heart size={15} />
          {t(space.setting === 'outdoor' ? 'Outdoor' : 'Indoor')} · DEMO
        </span>
      </div>
      <WeddingGallery key={space.id} name={space.name} photos={data.photos} />
      <div className="wedding-limits">
        <span>
          <UsersRound size={19} />
          {t('Duduk hingga {count} tamu', { count: data.seated ?? 0 })}
        </span>
        <span>
          <UsersRound size={19} />
          {t('Berdiri hingga {count} tamu', { count: data.standing ?? 0 })}
        </span>
        <span>
          <Clock3 size={19} />
          {data.openTime}–{data.closeTime} · {venue.zone}
        </span>
      </div>
      <nav className="venue-anchor-nav" aria-label={t('Detail Wedding Venue')}>
        {[
          ['wedding-overview', 'Area & akses'],
          ['wedding-packages', 'Paket pernikahan'],
          ['wedding-rules', 'Jam & ketentuan'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {t(label)}
          </a>
        ))}
      </nav>
      <div className="venue-detail-layout">
        <div>
          <section id="wedding-overview" className="venue-detail-section">
            <h2>{t('Bayangkan hari istimewa Anda di sini.')}</h2>
            <p>
              {t(
                'Bandingkan area, kapasitas, dan isi paket sebelum menyusun rencana bersama PIC.',
              )}
            </p>
            <label className="venue-space-selector">
              <span>{t('Pilih area perayaan')}</span>
              <select
                value={space.slug}
                onChange={(event) =>
                  router.push(
                    weddingLink(
                      `/wedding/${event.target.value}`,
                      query,
                      scenario,
                      context,
                    ),
                  )
                }
              >
                {data.areas.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
            <details className="venue-edit-needs venue-public-edit">
              <summary>{t('Ubah rencana pernikahan')}</summary>
              <WeddingSearchForm
                key={queryKey}
                initial={query}
                onApply={async (q) => {
                  router.replace(
                    weddingLink(`/wedding/${slug}`, q, scenario, {
                      ...context,
                      packageId: pack.id,
                    }),
                  );
                }}
              />
            </details>
            {!valid && (
              <p className="venue-capacity-warning" role="status">
                <Info size={18} />
                {t(
                  !validation.success
                    ? 'Periksa rencana pernikahan Anda'
                    : !fits
                      ? 'Jumlah tamu melebihi kapasitas format yang dipilih.'
                      : 'Tanggal atau area belum tersedia. Hubungi PIC untuk pilihan lain.',
                )}
              </p>
            )}
            <FacilityPoints facilities={space.facilities} />
            <div className="wedding-access">
              <p>
                <strong>{t('Akses tamu')}</strong>
                {t(data.access)}
              </p>
              <p>
                <strong>{t('Parkir')}</strong>
                {t(data.parking)}
              </p>
            </div>
          </section>
          <section id="wedding-packages" className="venue-detail-section">
            <h2>{t('Paket yang mengikuti cerita Anda')}</h2>
            <p>
              {t(
                'Harga mulai adalah tarif dasar. Estimasi acara dan isi paket ditampilkan terpisah.',
              )}
            </p>
            <div className="wedding-packages">
              {space.packages.map((item) => (
                <article
                  key={item.id}
                  className={`wedding-package-card ${pack.id === item.id ? 'selected' : ''}`}
                >
                  <label>
                    <input
                      type="radio"
                      name="wedding-package"
                      checked={item.id === pack.id}
                      onChange={() => {
                        const params = new URLSearchParams(raw);
                        params.set('packageId', item.id);
                        window.history.replaceState(
                          null,
                          '',
                          `/wedding/${slug}?${params}`,
                        );
                      }}
                    />
                    <span>
                      {t(item.name)}
                      <small>
                        {t(
                          item.wedding?.kind === 'venue-only'
                            ? 'Sewa venue saja'
                            : 'Paket perayaan',
                        )}
                      </small>
                    </span>
                  </label>
                  <p className="wedding-package-rate">
                    {item.amount === null
                      ? t('Minta penawaran')
                      : formatRupiah(item.amount, locale)}
                    {item.amount !== null && (
                      <span>
                        {' '}
                        / {t(item.basis === 'participant' ? 'tamu' : 'acara')}
                      </span>
                    )}
                  </p>
                  <span className="venue-indicative">
                    {t('Tarif dasar indikatif, bukan total seluruh acara')}
                  </span>
                  <div className="venue-package-facts">
                    <span>
                      <UsersRound size={16} />
                      {item.basis === 'participant'
                        ? t('Minimum tagihan {count} tamu', {
                            count: item.minParticipants,
                          })
                        : t(
                            item.basis === 'event'
                              ? 'Kapasitas mengikuti area pilihan'
                              : 'Minimum tamu mengikuti penawaran',
                          )}
                    </span>
                    <span>
                      <Clock3 size={16} />
                      {item.amount === null
                        ? t('Durasi mengikuti penawaran')
                        : t('{count} jam pemakaian', {
                            count: item.durationHours,
                          })}
                    </span>
                  </div>
                  {query.participants < item.minParticipants && (
                    <p className="venue-minimum-note">
                      <Info size={16} />
                      {t('Estimasi memakai minimum {count} tamu.', {
                        count: item.minParticipants,
                      })}
                    </p>
                  )}
                  <WeddingPackageScope pack={item} />
                  <ul>
                    {item.includes.map((text) => (
                      <li key={text}>
                        <Check size={16} />
                        {t(text)}
                      </li>
                    ))}
                  </ul>
                  <p className="venue-package-exclusions">
                    <strong>{t('Tidak termasuk')}: </strong>
                    {item.excludes.map((text) => t(text)).join(' · ')}
                  </p>
                  <small className="venue-package-tax">
                    {t(
                      'Pajak {tax}% dan layanan {service}% dihitung pada estimasi.',
                      { tax: item.taxPercent, service: item.servicePercent },
                    )}
                  </small>
                </article>
              ))}
            </div>
          </section>
          <section id="wedding-rules" className="venue-detail-section">
            <h2>{t('Ruang, waktu, dan kenyamanan bersama')}</h2>
            <ul className="venue-rule-points">
              <li>
                <Clock3 size={19} />
                {t('Jam operasional {start}–{end}', {
                  start: data.openTime,
                  end: data.closeTime,
                })}{' '}
                · {venue.zone}
              </li>
              <li>
                <Info size={19} />
                {t(
                  'Musik hingga {time}. Kebisingan dan soundcheck mengikuti arahan PIC.',
                  { time: data.musicUntil },
                )}
              </li>
              {space.rules.map((rule) => (
                <li key={rule}>
                  <Check size={18} />
                  {t(rule)}
                </li>
              ))}
            </ul>
            <WeddingScope />
          </section>
        </div>
        <aside className="venue-detail-summary wedding-summary">
          <span className="venue-summary-icon">
            <Heart />
          </span>
          <h2>{t('Mulai rencana hari bahagia')}</h2>
          <WeddingSummary query={query} zone={venue.zone} />
          <div className="venue-estimate">
            <small>{t('Estimasi indikatif, bukan harga final')}</small>
            <strong>
              {estimate
                ? formatRupiah(estimate.total, locale)
                : t('Minta penawaran')}
            </strong>
            <span>{t(pack.name)}</span>
          </div>
          {estimate && (
            <dl className="venue-price-lines">
              <div>
                <dt>{t('Paket dasar')}</dt>
                <dd>{formatRupiah(estimate.packageBase, locale)}</dd>
              </div>
              {estimate.overtime > 0 && (
                <div>
                  <dt>{t('Overtime')}</dt>
                  <dd>{formatRupiah(estimate.overtime, locale)}</dd>
                </div>
              )}
              <div>
                <dt>{t('Pajak & layanan')}</dt>
                <dd>
                  {formatRupiah(estimate.tax + estimate.serviceFee, locale)}
                </dd>
              </div>
            </dl>
          )}
          {valid ? (
            <Button asChild className="w-full">
              <Link href={inquiry}>
                {t('Kirim inquiry / site visit')}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button className="w-full" disabled>
              {t('Periksa rencana')}
            </Button>
          )}
          <Button variant="outline" asChild className="w-full mt-3">
            <Link href={request}>{t('Ajukan permintaan booking')}</Link>
          </Button>
          <p className="venue-inline-note">
            <Info size={16} />
            {t(
              'Belum ada pembayaran atau penguncian tanggal. PIC akan meninjau kebutuhan Anda.',
            )}
          </p>
        </aside>
      </div>
      <div className="venue-mobile-cta">
        <span>
          <small>{t('Estimasi indikatif')}</small>
          <strong>
            {estimate
              ? formatRupiah(estimate.total, locale)
              : t('Minta penawaran')}
          </strong>
        </span>
        {valid ? (
          <Button asChild>
            <Link href={inquiry}>
              {t('Kirim inquiry')}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button disabled>{t('Periksa rencana')}</Button>
        )}
      </div>
      <div className="wedding-mobile-request">
        <Link href={request}>{t('Ajukan permintaan booking')}</Link>
      </div>
    </main>
  );
}
