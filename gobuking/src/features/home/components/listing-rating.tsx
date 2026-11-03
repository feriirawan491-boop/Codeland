'use client';
import { Star } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import type { Listing } from '../lib/content';
export function ListingRating({ review }: { review: Listing['review'] }) {
  const { t, locale } = useI18n();
  if (!review || review.count === 0)
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        {t('Belum ada ulasan')}
      </p>
    );
  const score = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(review.score);
  return (
    <div className="listing-rating">
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex gap-0.5"
          role="img"
          aria-label={t('Skor ulasan contoh {score} dari 10', { score })}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="relative inline-flex size-4"
              aria-hidden="true"
            >
              <Star
                className="size-4 fill-slate-100 text-slate-300"
                strokeWidth={1.5}
              />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{
                  width: `${Math.min(1, Math.max(0, review.score / 2 - i)) * 100}%`,
                }}
              >
                <Star
                  className="size-4 max-w-none fill-amber-400 text-amber-500"
                  strokeWidth={1.5}
                />
              </span>
            </span>
          ))}
        </span>
        <span className="text-xs text-muted-foreground">
          <strong className="rating-score">{score}</strong> / 10
        </span>
      </div>
    </div>
  );
}
