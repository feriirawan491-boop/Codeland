'use client';
import Image from 'next/image';
import { AMENITY_ICONS, FacilityIcon } from './facility-icon';
import Link from 'next/link';
import { Heart, MapPin, Star, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/components/i18n/locale-provider';
import { Button } from '@/components/ui/button';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { formatRupiah } from '@/lib/utils';
import { hotelLink, AMENITY_LABELS } from '../lib/query';
import type { HotelQuery, HotelResult, HotelScenario } from '../lib/types';
export function HotelSaveButton({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const { saved, update } = useSavedListings();
  const active = saved.includes(id);
  return (
    <button
      type="button"
      className="hotel-save"
      aria-pressed={active}
      aria-label={t(active ? 'Hapus {0} dari tersimpan' : 'Simpan {0}', {
        '0': name,
      })}
      onClick={() => {
        try {
          update(active ? saved.filter((s) => s !== id) : [...saved, id]);
          toast.success(
            t(active ? 'Dihapus dari tersimpan' : 'Disimpan di browser ini'),
          );
        } catch {
          toast.error(t('Belum dapat menyimpan'));
        }
      }}
    >
      <Heart size={19} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
export function StarClass({ stars }: { stars: number }) {
  const { t } = useI18n();
  return (
    <span
      className="hotel-star-class"
      role="img"
      aria-label={t('Hotel bintang {count} · contoh', { count: stars })}
    >
      {Array.from({ length: stars }, (_, i) => (
        <Star size={13} key={i} className="fill-amber-400 text-amber-600" />
      ))}
    </span>
  );
}
export function ReviewScore({ score }: { score: number | null }) {
  const { t, locale } = useI18n();
  return score === null ? (
    <span className="text-xs text-muted-foreground">
      {t('Belum ada ulasan')}
    </span>
  ) : (
    <div className="hotel-review-score">
      <div>
        <strong>{t(score >= 9 ? 'Istimewa' : 'Sangat baik')}</strong>
        <span>{t('Skor ulasan demo')}</span>
      </div>
      <b>
        {new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
          minimumFractionDigits: 1,
        }).format(score)}
      </b>
    </div>
  );
}
export function HotelResultCard({
  result,
  query,
  scenario,
  selected = false,
}: {
  result: HotelResult;
  query: HotelQuery;
  scenario: HotelScenario;
  selected?: boolean;
}) {
  const { t, locale } = useI18n();
  const { hotel, quote, room, rate } = result;
  const href = hotelLink(hotel.slug, query, scenario);
  return (
    <article
      id={`hotel-${hotel.id}`}
      tabIndex={-1}
      className={`hotel-result-card ${selected ? 'is-selected' : ''}`}
    >
      <div className="hotel-result-photo">
        <Link href={href} aria-label={t('Lihat {0}', { '0': hotel.name })}>
          <Image
            src={`/images/${hotel.images[0]}.jpg`}
            alt={t('Ilustrasi {0}', { '0': hotel.name })}
            fill
            sizes="(max-width:767px) 95vw, 260px"
            className="object-cover"
          />
        </Link>
        <HotelSaveButton id={hotel.id} name={hotel.name} />
        <span className="hotel-photo-badge">{t('Pesan langsung')}</span>
      </div>
      <div className="hotel-result-main">
        <div className="flex flex-wrap items-center gap-2">
          <StarClass stars={hotel.stars} />
          <span className="text-xs text-muted-foreground">
            {t(hotel.propertyType === 'resort' ? 'Resort' : 'Hotel')}
          </span>
        </div>
        <h2>
          <Link href={href}>{hotel.name}</Link>
        </h2>
        <p className="hotel-card-location">
          <MapPin size={13} />
          {hotel.area}
          <span>
            · {t('{distance} km dari pusat area', { distance: hotel.distance })}
          </span>
        </p>
        <div className="hotel-amenity-chips">
          {hotel.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>
              <FacilityIcon name={AMENITY_ICONS[amenity]} size={13} />
              {t(AMENITY_LABELS[amenity])}
            </span>
          ))}
        </div>
        <div className="hotel-room-summary">
          <strong>{t(room.name)}</strong>
          <span>{t(room.beds)}</span>
          <span
            className={
              rate.freeCancellation ? 'hotel-positive' : 'text-muted-foreground'
            }
          >
            <Check size={13} />
            {t(
              rate.freeCancellation
                ? 'Pembatalan gratis sesuai ketentuan'
                : 'Tarif non-refundable',
            )}
          </span>
          {rate.breakfast && (
            <span className="hotel-positive">
              <Check size={13} />
              {t('Termasuk sarapan')}
            </span>
          )}
        </div>
      </div>
      <div className="hotel-result-price">
        <ReviewScore score={hotel.score} />
        <div className="hotel-price-bottom">
          <p>
            {t('{nights} malam · {rooms} kamar', {
              nights: quote.nights,
              rooms: quote.quantity,
            })}
          </p>
          <strong>{formatRupiah(quote.total, locale)}</strong>
          <span>{t('Termasuk pajak & biaya wajib')}</span>
          <Button asChild>
            <Link href={href}>
              {t('Lihat kamar')}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
