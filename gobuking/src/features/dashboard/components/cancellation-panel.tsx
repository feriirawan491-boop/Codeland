'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { previewCancellation, requestCancellation } from '../lib/bookings';
import type { CancellationPreview } from '@/features/booking/lib/cancellation';
import { errorMessage, FormError, money } from './shared';
export function CancellationPanel({
  id,
  onComplete,
}: {
  id: string;
  onComplete?: () => void;
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<CancellationPreview | null>(null),
    [reason, setReason] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function open() {
    setBusy(true);
    setError('');
    try {
      setPreview(await previewCancellation(id));
      setConsent(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!preview || !consent || busy) return;
    setBusy(true);
    setError('');
    try {
      await requestCancellation(id, preview, reason, crypto.randomUUID());
      setPreview(null);
      onComplete?.();
    } catch (e) {
      setError(errorMessage(e));
      try {
        setPreview(await previewCancellation(id));
        setConsent(false);
      } catch {
        setPreview(null);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="usr-cancel">
      <button className="usr-button secondary" disabled={busy} onClick={open}>
        {t(preview ? 'Perbarui estimasi' : 'Tinjau pembatalan')}
      </button>
      {preview && (
        <div className="usr-inset">
          <h3>{t('Estimasi pembatalan')}</h3>
          <p>{t(preview.policy)}</p>
          <dl className="usr-totals">
            <div>
              <dt>{t('Sudah dibayar')}</dt>
              <dd>{money(preview.paid)}</dd>
            </div>
            <div>
              <dt>{t('Biaya pembatalan')}</dt>
              <dd>{money(preview.fee)}</dd>
            </div>
            <div>
              <dt>{t('Estimasi refund')}</dt>
              <dd>{money(preview.refund)}</dd>
            </div>
          </dl>
          <p>
            {t(
              'Estimasi berlaku 5 menit. Refund yang diproses belum berarti dana sudah diterima.',
            )}
          </p>
          {preview.eligible ? (
            <>
              <label>
                {t('Alasan pembatalan')}
                <textarea
                  value={reason}
                  minLength={5}
                  maxLength={1000}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label className="usr-check">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {t('Saya memahami biaya dan estimasi refund ini.')}
              </label>
              <button
                className="usr-button danger"
                disabled={busy || !consent || reason.trim().length < 5}
                onClick={confirm}
              >
                {t('Konfirmasi pembatalan')}
              </button>
            </>
          ) : (
            <p>{t(preview.reason ?? 'Pembatalan tidak tersedia.')}</p>
          )}
        </div>
      )}
      <FormError message={error} />
    </div>
  );
}
