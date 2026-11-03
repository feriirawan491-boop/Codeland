'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Images, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
import type { Hotel, HotelReview } from '@/features/hotel/lib/types';
import { dateLabel } from '@/features/hotel/components/shared';
import { ReviewScore } from '@/features/hotel/components/hotel-card';
export function PropertyGallery({
  hotel,
}: {
  hotel: Pick<Hotel, 'name' | 'images'>;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <div className="hotel-gallery">
        {hotel.images.map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            className={index === 0 ? 'gallery-main' : ''}
            onClick={() => setActive(index)}
            aria-label={t('Buka foto {number}', { number: index + 1 })}
          >
            <Image
              src={`/images/${image}.jpg`}
              alt={t('Ilustrasi {0}', { '0': hotel.name })}
              fill
              priority={index === 0}
              sizes={
                index === 0
                  ? '(max-width:767px) 95vw, 60vw'
                  : '(max-width:767px) 45vw, 25vw'
              }
              className="object-cover"
            />
            {index === hotel.images.length - 1 && (
              <span>
                <Images size={16} />
                {t('Lihat foto')}
              </span>
            )}
          </button>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogTitle className="pr-10 text-xl font-bold">
            {hotel.name}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {t('Foto ilustrasi properti demo.')}
          </DialogDescription>
          <div className="relative my-5 aspect-video overflow-hidden rounded-xl">
            <Image
              src={`/images/${hotel.images[active ?? 0]}.jpg`}
              fill
              sizes="900px"
              alt={t('Ilustrasi {0}', { '0': hotel.name })}
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Foto sebelumnya')}
              onClick={() =>
                setActive(
                  (i) =>
                    ((i ?? 0) - 1 + hotel.images.length) % hotel.images.length,
                )
              }
            >
              <ChevronLeft />
            </Button>
            <span>
              {(active ?? 0) + 1} / {hotel.images.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Foto berikutnya')}
              onClick={() =>
                setActive((i) => ((i ?? 0) + 1) % hotel.images.length)
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PropertyReviews({
  hotel,
}: {
  hotel: Pick<Hotel, 'reviews' | 'score'>;
}) {
  const { t, locale } = useI18n();
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [response, setResponse] = useState<{
    sort: string;
    reviews: HotelReview[];
  }>({ sort: 'recent', reviews: hotel.reviews });
  useEffect(() => {
    let current = true;
    hotelAdapter.listReviews(hotel, sort).then((reviews) => {
      if (current) setResponse({ sort, reviews });
    });
    return () => {
      current = false;
    };
  }, [hotel, sort]);
  return (
    <section id="hotel-reviews" className="hotel-detail-section">
      <div className="section-heading">
        <div>
          <h2>{t('Ulasan tamu')}</h2>
          <p>{t('Seluruh ulasan pada halaman ini adalah data contoh.')}</p>
        </div>
        <label className="hotel-sort">
          <span>{t('Urutan ulasan')}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="recent">{t('Terbaru')}</option>
            <option value="highest">{t('Skor tertinggi')}</option>
            <option value="lowest">{t('Skor terendah')}</option>
          </select>
        </label>
      </div>
      {!hotel.reviews.length ? (
        <p className="hotel-inline-note">{t('Belum ada ulasan')}</p>
      ) : (
        <>
          <div className="hotel-review-intro">
            <ReviewScore score={hotel.score} />
          </div>
          {response.sort !== sort ? (
            <div
              className="skeleton h-40 rounded-xl"
              aria-label={t('Memuat ulasan')}
            />
          ) : (
            <div className="hotel-review-grid">
              {response.reviews.map((review) => (
                <article key={review.id}>
                  <div className="flex items-center justify-between gap-4">
                    <strong>{review.author}</strong>
                    <span className="hotel-score-small">
                      {new Intl.NumberFormat(
                        locale === 'en' ? 'en-GB' : 'id-ID',
                        { minimumFractionDigits: 1 },
                      ).format(review.score)}{' '}
                      / 10
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(review.trip)} · {dateLabel(review.date, locale)}
                  </p>
                  <h3>{t(review.title)}</h3>
                  <p>{t(review.body)}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <p className="hotel-inline-note mt-5">
        <ShieldCheck size={17} />
        {t(
          'Menulis ulasan hanya tersedia untuk pesanan dengan layanan selesai. Fitur akun dilanjutkan pada Phase 08.',
        )}
      </p>
    </section>
  );
}
