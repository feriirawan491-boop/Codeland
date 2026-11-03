'use client';
import { SavePropertyButton } from '@/components/shared/save-property-button';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Info,
  MapPin,
  Maximize,
  Presentation,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import { venueAdapter } from '@/features/venue/lib/adapter';
import {
  eventParams,
  eventSchema,
  parseEventQuery,
  venueLink,
  venueScenario,
} from '@/features/venue/lib/query';
import { packageEstimate } from '@/features/venue/lib/pricing';
import { spaceAvailable } from '@/features/venue/lib/resources';
import { LAYOUT_LABELS } from '@/features/venue/lib/config';
import type { Venue, VenueSpace } from '@/features/venue/lib/types';
import { CapacityMatrix } from './capacity-matrix';
import { EventSearchForm } from './event-search-form';
import { PackageCard } from './package-card';
import { VenueGallery } from './venue-gallery';
import {
  EventSummary,
  FacilityPoints,
  InquiryOnlyNotice,
  ScopeNote,
  VenueDemoNotice,
  VenueErrorPanel,
  VenueLoading,
} from './shared';
export function SpaceDetail({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const search = useSearchParams();
  const router = useRouter();
  const raw = search.toString();
  const scenario = venueScenario(search);
  const key = `${slug}:${scenario}`;
  const [response, setResponse] = useState<{
    key: string;
    venue?: Venue;
    space?: VenueSpace;
    error?: Error;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    venueAdapter
      .getMeetingSpace(slug, scenario, controller.signal)
      .then((value) => setResponse({ key, ...value }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError')
          setResponse({ key, error });
      });
    return () => controller.abort();
  }, [slug, scenario, key]);
  const venue = response?.key === key ? response.venue : undefined,
    space = response?.key === key ? response.space : undefined,
    error = response?.key === key ? response.error : undefined;
  const queryKey = eventParams(parseEventQuery(search)).toString();
  const parsed = useMemo(
    () => parseEventQuery(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const query = {
    ...parsed,
    locationId: search.has('locationId')
      ? parsed.locationId
      : (venue?.locationId ?? parsed.locationId),
  };
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener('gobuking:venue-resource-changed', refresh);
    return () =>
      window.removeEventListener('gobuking:venue-resource-changed', refresh);
  }, []);
  void revision;
  const backContext = Object.fromEntries(
    [
      'setting',
      'facilities',
      'basis',
      'maxRate',
      'sort',
      'keyword',
      'page',
    ].map((k) => [k, search.get(k) ?? '']),
  );
  const back = venueLink('/mice', query, scenario, backContext);
  if (!venue || !space)
    return (
      <main id="main" className="venue-module page-container py-8">
        <Link className="venue-back" href={back}>
          <ArrowLeft size={17} />
          {t('Kembali ke hasil ruang')}
        </Link>
        {error ? (
          <VenueErrorPanel
            key={key}
            error={error}
            onRetry={() => router.replace(venueLink(`/mice/${slug}`, query))}
          />
        ) : (
          <VenueLoading />
        )}
      </main>
    );
  const pack =
    space.packages.find((p) => p.id === search.get('packageId')) ??
    space.packages[0];
  const valid = eventSchema.safeParse(query);
  const capacity = space.capacity[query.layout];
  const fits = (capacity ?? 0) >= query.participants;
  const available =
    valid.success &&
    spaceAvailable(space, query, venue) &&
    scenario !== 'blocked';
  const canInquire =
    valid.success && fits && available && query.locationId === venue.locationId;
  const estimate = valid.success ? packageEstimate(pack, query) : null;
  const inquiry = venueLink(`/mice/${space.slug}/inquiry`, query, scenario, {
    packageId: pack.id,
  });
  return (
    <main id="main" className="venue-module page-container venue-detail">
      <Link className="venue-back" href={back}>
        <ArrowLeft size={17} />
        {t('Kembali ke hasil ruang')}
      </Link>
      <VenueDemoNotice />
      <div className="venue-detail-heading">
        <div>
          <p className="venue-parent-name">
            <Building2 size={16} />
            {venue.name}
          </p>
          <h1>{space.name}</h1>
          <SavePropertyButton id={`mice:${space.id}`} />
          <p>
            <MapPin size={16} />
            {venue.area} · {venue.zone}
          </p>
        </div>
        <span>
          {t(space.setting === 'indoor' ? 'Indoor' : 'Outdoor')} · DEMO
        </span>
      </div>
      <VenueGallery name={space.name} images={space.images} />
      <nav className="venue-anchor-nav" aria-label={t('Bagian detail ruang')}>
        {[
          ['venue-overview', 'Ringkasan'],
          ['venue-capacity', 'Kapasitas & layout'],
          ['venue-packages', 'Paket meeting'],
          ['venue-rules', 'Ketentuan ruang'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {t(label)}
          </a>
        ))}
      </nav>
      <div className="venue-detail-layout">
        <div>
          <section id="venue-overview" className="venue-detail-section">
            <div className="venue-room-facts">
              <span>
                <Maximize size={20} />
                {space.area} m²
              </span>
              <span>
                <UsersRound size={20} />
                {capacity === null
                  ? t('Perlu konfirmasi')
                  : t('{count} peserta', { count: capacity })}{' '}
                · {LAYOUT_LABELS[query.layout]}
              </span>
              <span>
                <Presentation size={20} />
                {t(space.setting === 'indoor' ? 'Indoor' : 'Outdoor')}
              </span>
            </div>
            <h2>{t('Ruang yang pas untuk langkah berikutnya.')}</h2>
            <p>{t(venue.description)}</p>
            <label className="venue-space-selector">
              <span>{t('Pilih ruang di venue ini')}</span>
              <select
                value={space.slug}
                onChange={(e) =>
                  router.push(
                    venueLink(
                      `/mice/${e.target.value}`,
                      query,
                      scenario,
                      backContext,
                    ),
                  )
                }
              >
                {venue.spaces
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name} · {s.area} m²
                    </option>
                  ))}
              </select>
            </label>
            <details
              className="venue-edit-needs venue-public-edit"
              id="venue-event-edit"
            >
              <summary>{t('Ubah kebutuhan acara')}</summary>
              <EventSearchForm
                key={queryKey}
                initial={query}
                onApply={async (q) => {
                  router.replace(
                    venueLink(`/mice/${space.slug}`, q, scenario, {
                      ...backContext,
                      packageId: pack.id,
                    }),
                  );
                }}
              />
            </details>
            {!canInquire && (
              <p className="venue-capacity-warning" role="status">
                <Info size={18} />
                {t(
                  !valid.success
                    ? 'Periksa tanggal dan kebutuhan acara.'
                    : !fits
                      ? 'Jumlah peserta melebihi kapasitas layout ruang ini.'
                      : query.locationId !== venue.locationId
                        ? 'Kota acara tidak sesuai dengan lokasi ruang.'
                        : 'Ruang sedang diblokir. Minta PIC memvalidasi ulang jadwal.',
                )}
              </p>
            )}

            <FacilityPoints facilities={space.facilities} />
          </section>
          <CapacityMatrix space={space} query={query} />
          <section id="venue-packages" className="venue-detail-section">
            <h2>{t('Pilih paket, sesuaikan kebutuhan')}</h2>
            <p>
              {t('Basis harga dan minimum peserta berbeda untuk setiap paket.')}
            </p>
            <div className="venue-packages-grid">
              {space.packages.map((p) => (
                <PackageCard
                  key={p.id}
                  pack={p}
                  query={query}
                  selected={p.id === pack.id}
                  onSelect={() => {
                    const params = new URLSearchParams(raw);
                    params.set('packageId', p.id);
                    window.history.replaceState(
                      null,
                      '',
                      `/mice/${space.slug}?${params}`,
                    );
                  }}
                />
              ))}
            </div>
          </section>
          <section id="venue-rules" className="venue-detail-section">
            <h2>{t('Ketentuan penggunaan ruang')}</h2>
            <ul className="venue-rule-points">
              {space.rules.map((rule) => (
                <li key={rule}>
                  <Check size={18} />
                  {t(rule)}
                </li>
              ))}
            </ul>
            <InquiryOnlyNotice />
          </section>
        </div>
        <aside className="venue-detail-summary">
          <span className="venue-summary-icon">
            <Presentation />
          </span>
          <h2>{t('Rencanakan acara Anda')}</h2>
          <EventSummary query={query} zone={venue.zone} />

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
                <dt>{t('Biaya ruang & paket')}</dt>
                <dd>{formatRupiah(estimate.base, locale)}</dd>
              </div>
              <div>
                <dt>{t('Biaya layanan')}</dt>
                <dd>{formatRupiah(estimate.serviceFee, locale)}</dd>
              </div>
              <div>
                <dt>{t('Pajak')}</dt>
                <dd>{formatRupiah(estimate.tax, locale)}</dd>
              </div>
            </dl>
          )}
          {canInquire ? (
            <Button asChild className="w-full">
              <Link href={inquiry}>
                {t('Kirim inquiry')}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button className="w-full" disabled>
              {t('Kirim inquiry')}
            </Button>
          )}
          <ScopeNote />
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
        {canInquire ? (
          <Button asChild>
            <Link href={inquiry}>
              {t('Kirim inquiry')}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button disabled>{t('Periksa kebutuhan')}</Button>
        )}
      </div>
    </main>
  );
}
