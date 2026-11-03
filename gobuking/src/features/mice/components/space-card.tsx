'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Maximize, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatRupiah } from '@/lib/utils';
import {
  BASIS_LABELS,
  LAYOUT_LABELS,
  FACILITY_LABELS,
} from '@/features/venue/lib/config';
import { venueLink } from '@/features/venue/lib/query';
import type {
  EventQuery,
  SpaceResult,
  VenueScenario,
} from '@/features/venue/lib/types';
import { FACILITY_ICONS } from './shared';
export function SpaceCard({
  result,
  query,
  scenario,
  context,
}: {
  result: SpaceResult;
  query: EventQuery;
  scenario: VenueScenario;
  context: Record<string, string>;
}) {
  const { t, locale } = useI18n();
  const { space, venue, package: pack } = result;
  const href = venueLink(`/mice/${space.slug}`, query, scenario, {
    ...context,
    packageId: pack?.id ?? '',
  });
  return (
    <article className="venue-space-card">
      <div className="venue-space-photo">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={`/images/${space.images[0]}.jpg`}
            fill
            sizes="(max-width:767px) 100vw, 420px"
            alt={t('Ilustrasi ruang {name}', { name: space.name })}
            className="object-cover"
          />
        </Link>
        <span>
          {t(space.setting === 'indoor' ? 'Indoor' : 'Outdoor')} · DEMO
        </span>
      </div>
      <div className="venue-space-content">
        <div className="venue-card-location">
          <MapPin size={13} />
          {venue.area}
        </div>
        <p className="venue-parent-name">{venue.name}</p>
        <h2>
          <Link href={href}>{space.name}</Link>
        </h2>
        <div className="venue-space-facts">
          <span>
            <UsersRound size={16} />
            {t('{count} peserta', {
              count: space.capacity[query.layout] ?? 0,
            })}{' '}
            · {LAYOUT_LABELS[query.layout]}
          </span>
          <span>
            <Maximize size={15} />
            {space.area} m²
          </span>
        </div>
        <div className="venue-card-facilities">
          {(Object.keys(FACILITY_ICONS) as (keyof typeof FACILITY_ICONS)[])
            .filter((f) => space.facilities[f] === true)
            .slice(0, 3)
            .map((f) => {
              const Icon = FACILITY_ICONS[f];
              return (
                <span key={f}>
                  <Icon size={16} />
                  <small>{t(FACILITY_LABELS[f])}</small>
                </span>
              );
            })}
        </div>
        <div className="venue-card-bottom">
          <div>
            <small>{t('Tarif indikatif paket')}</small>
            <strong>
              {pack?.amount === null || !pack
                ? t('Minta penawaran')
                : formatRupiah(pack.amount, locale)}
              {pack?.amount !== null && pack && (
                <span> / {t(BASIS_LABELS[pack.basis])}</span>
              )}
            </strong>
            {pack && (
              <p>
                {t('Minimum {count} peserta', { count: pack.minParticipants })}
              </p>
            )}
          </div>
          <Button
            asChild
            size="icon"
            aria-label={t('Lihat ruang {name}', { name: space.name })}
          >
            <Link href={href}>
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
