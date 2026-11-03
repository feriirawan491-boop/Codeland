'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  listMyReviews,
  reviewEligibility,
  submitReview,
  simulateReviewModeration,
} from '../lib/reviews';
import { REVIEW_STATUS } from '../lib/config';
import {
  useResource,
  ResourceState,
  Empty,
  errorMessage,
  FormError,
} from './shared';
export function ReviewsPanel() {
  const { t } = useI18n(),
    r = useResource(
      async () => ({
        reviews: await listMyReviews(),
        eligibility: await reviewEligibility(),
      }),
      'reviews',
    ),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <>
      <p>
        {t(
          'Bagikan pengalaman setelah layanan selesai. Ulasan melewati moderasi sebelum dipublikasikan; jendela ulasan demo 90 hari.',
        )}
      </p>
      <ResourceState {...r} retry={r.reload} />
      {r.data && !r.data.reviews.length && !r.data.eligibility.length && (
        <Empty title="Belum ada layanan yang dapat diulas" />
      )}
      {r.data?.reviews.map((v) => (
        <article className="usr-card" key={v.id}>
          <span className="usr-score">{v.score}/10</span>
          <h3>{v.title}</h3>
          <p>{v.body}</p>
          <span className="usr-badge">{t(REVIEW_STATUS[v.status])}</span>
          <details className="mt-4">
            <summary>{t('Simulasi moderasi ulasan')}</summary>
            <div className="usr-actions">
              {(['publish', 'reply', 'reject'] as const).map((action) => (
                <button
                  key={action}
                  className="usr-button secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await simulateReviewModeration(v.id, action);
                      r.reload();
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t(
                    action === 'publish'
                      ? 'Publikasikan demo'
                      : action === 'reply'
                        ? 'Balasan mitra demo'
                        : 'Minta perbaikan demo',
                  )}
                </button>
              ))}
            </div>
          </details>
          {v.reply && (
            <blockquote>
              {t('Balasan mitra')}: {v.reply}
            </blockquote>
          )}
        </article>
      ))}
      {r.data?.eligibility.map((v) => (
        <article className="usr-card" key={v.booking.id}>
          <h3>{v.booking.title}</h3>
          {!v.eligible ? (
            <p>{t(v.reason ?? 'Ulasan tidak tersedia.')}</p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(true);
                setError('');
                try {
                  await submitReview(
                    {
                      bookingId: v.booking.id,
                      score: Number(f.get('score')),
                      title: f.get('title'),
                      body: f.get('body'),
                      subscore: f.get('subscore')
                        ? Number(f.get('subscore'))
                        : null,
                    },
                    crypto.randomUUID(),
                  );
                  r.reload();
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset>
                <legend>{t('Nilai pengalaman Anda (1–10)')}</legend>
                <div className="usr-rating">
                  {Array.from({ length: 10 }, (_, i) => (
                    <label key={i}>
                      <input type="radio" name="score" value={i + 1} required />
                      <span>{i + 1}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                {t('Nilai kebersihan (opsional)')}
                <select
                  aria-label={t('Nilai kebersihan (opsional)')}
                  name="subscore"
                >
                  <option value="">{t('Tidak diisi')}</option>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('Judul ulasan')}
                <input name="title" required minLength={5} maxLength={120} />
              </label>
              <label>
                {t('Ceritakan pengalaman Anda')}
                <textarea
                  name="body"
                  required
                  minLength={20}
                  maxLength={2000}
                />
              </label>
              <button className="usr-button" disabled={busy}>
                {t('Kirim ulasan untuk moderasi')}
              </button>
            </form>
          )}
        </article>
      ))}
      <FormError message={error} />
    </>
  );
}
