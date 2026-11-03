'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  BedDouble,
  Bath,
  MapPin,
  UsersRound,
  House,
} from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import {
  HotelSaveButton,
  ReviewScore,
} from '@/features/hotel/components/hotel-card';
import { homeLink, HOME_TYPE_LABELS, HOME_AMENITY_LABELS } from '../lib/query';
import { HomeAmenityIcon } from './shared';
import type { HomeQuery, HomeResult } from '../lib/types';
import type { HotelScenario } from '@/features/hotel/lib/types';
export function HomeCard({
  result,
  query,
  scenario,
  selected,
}: {
  result: HomeResult;
  query: HomeQuery;
  scenario: HotelScenario;
  selected?: boolean;
}) {
  const { t, locale } = useI18n();
  const { home, quote } = result;
  const href = homeLink(home.slug, query, scenario);
  return (
    <article
      id={`home-${home.id}`}
      tabIndex={-1}
      className={`home-result-card ${selected ? 'is-selected' : ''}`}
    >
      <div className="home-card-photo">
        <Link href={href} aria-label={t('Lihat {0}', { '0': home.name })}>
          <Image
            src={`/images/${home.images[0]}.jpg`}
            alt={t('Ilustrasi {0}', { '0': home.name })}
            fill
            className="object-cover"
            sizes="(max-width:767px) 95vw, (max-width:1199px) 60vw, 35vw"
          />
        </Link>
        <span className="home-entire-badge">
          <House size={14} />
          {t('Seluruh hunian')}
        </span>
        <HotelSaveButton id={home.id} name={home.name} />
      </div>
      <div className="home-card-body">
        <div className="home-card-location">
          <span>
            <MapPin size={13} />
            {home.area}
          </span>
          <span>{t(HOME_TYPE_LABELS[home.type])}</span>
        </div>
        <h2>
          <Link href={href}>{home.name}</Link>
        </h2>
        <div className="home-card-configuration">
          <span>
            <BedDouble size={15} />
            {t('{count} kamar tidur', { count: home.bedrooms })}
          </span>
          <span>
            <Bath size={15} />
            {t('{count} kamar mandi', { count: home.bathrooms })}
          </span>
          <span>
            <UsersRound size={15} />
            {t('Maks. {count} tamu', { count: home.maxGuests })}
          </span>
        </div>
        <div className="hotel-amenity-chips">
          {home.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>
              <HomeAmenityIcon name={amenity} size={13} />
              {t(HOME_AMENITY_LABELS[amenity])}
            </span>
          ))}
        </div>
        <div className="home-card-review">
          <ReviewScore score={home.score} />
          <span className="home-rate-policy">
            {t(
              home.freeCancellation
                ? 'Tarif fleksibel'
                : 'Tarif non-refundable',
            )}
          </span>
        </div>
        <div className="home-card-price">
          <div>
            <span>
              {t('Total {nights} malam · 1 hunian', { nights: quote.nights })}
            </span>
            <strong>{formatRupiah(quote.total, locale)}</strong>
            <small>{t('Termasuk kebersihan, pajak & biaya wajib')}</small>
          </div>
          <Button
            asChild
            size="icon"
            aria-label={t('Lihat hunian {name}', { name: home.name })}
          >
            <Link href={href}>
              <ArrowUpRight size={20} />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
