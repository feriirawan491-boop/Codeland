'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  previewAdminRefund,
  requestAdminRefund,
  approveAdminRefund,
  recordRefundEvidence,
  reconcilePayment,
  previewPayout,
  createPayoutBatch,
  approvePayoutBatch,
  recordTransfer,
  reconcilePayout,
} from '../lib/finance';
import type { AdminWorkspace } from '../lib/adapter';
import type { PayoutPreview } from '../lib/types';
import { REFUND_STATES, BATCH_STATES } from '../lib/config';
import {
  AdminFeedback,
  useAdminAction,
  FormField,
  field,
  uploaded,
  FileInput,
  ReviewAction,
  Badge,
  money,
  Empty,
} from './shared';
export function PaymentsPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    [preview, setPreview] = useState<Awaited<
      ReturnType<typeof previewAdminRefund>
    > | null>(null);
  return (
    <>
      <p className="ptr-notice">
        {t(
          'Pembayaran, reservasi, dan refund memiliki status terpisah. Persetujuan refund belum berarti dana telah kembali.',
        )}
      </p>
      {data.bookings
        .filter((b) => b.paid > 0)
        .map((b) => (
          <article className="ptr-card" key={b.id}>
            <div className="ptr-row">
              <div>
                <span className="ptr-eyebrow">{b.id}</span>
                <h3>{b.name}</h3>
                <p>
                  {t('Pembayaran terverifikasi')}:{' '}
                  <strong>{money(b.paid)}</strong>
                </p>
                <Badge>
                  {t(
                    b.status === 'exception'
                      ? 'Reservasi exception'
                      : b.status === 'cancelled'
                        ? 'Reservasi dibatalkan'
                        : 'Status reservasi',
                  )}
                  : {b.status}
                </Badge>
              </div>
              <div className="ptr-actions">
                {data.ctx.capabilities.includes('refund_request') && (
                  <button
                    className="ptr-button secondary"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(
                        async () => setPreview(await previewAdminRefund(b.id)),
                        'Preview refund siap.',
                        false,
                      )
                    }
                  >
                    {t('Preview refund')}
                  </button>
                )}
                {data.ctx.capabilities.includes('reconcile') && (
                  <ReviewAction
                    label="Rekonsiliasi pembayaran"
                    description={b.id}
                  >
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        await a.run(
                          () =>
                            reconcilePayment(
                              b.id,
                              field(f, 'event'),
                              Number(f.get('amount')),
                              field(f, 'reference'),
                              field(f, 'reason'),
                            ),
                          'Hasil rekonsiliasi pembayaran tercatat.',
                        );
                      }}
                    >
                      <FormField label="Gateway event ID">
                        <input name="event" required minLength={8} />
                      </FormField>
                      <FormField label="Nominal gateway (IDR)">
                        <input
                          name="amount"
                          type="number"
                          min={1}
                          required
                          defaultValue={b.paid}
                        />
                      </FormField>
                      <FormField label="Referensi bukti">
                        <input name="reference" required minLength={8} />
                      </FormField>
                      <FormField label="Alasan rekonsiliasi">
                        <textarea name="reason" required minLength={10} />
                      </FormField>
                      <button className="ptr-button" disabled={a.busy}>
                        {t('Cocokkan fakta gateway')}
                      </button>
                    </form>
                    <AdminFeedback {...a} />
                  </ReviewAction>
                )}
              </div>
            </div>
            {preview?.id === b.id && (
              <div className="ptr-inset">
                <h3>{t('Preview sisa refundable')}</h3>
                <p>
                  {t('Sisa refund baru')}:{' '}
                  <strong>{money(preview.remaining)}</strong> ·{' '}
                  {t('Refund sumber menunggu review')}:{' '}
                  {money(preview.sourcePending)}
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const source = field(f, 'mode') === 'source';
                    if (
                      await a.run(
                        (id) =>
                          requestAdminRefund(
                            b.id,
                            Number(f.get('amount')),
                            preview.version,
                            field(f, 'reason'),
                            id,
                            source,
                            new URLSearchParams(window.location.search).get(
                              'scenario',
                            ) ?? 'ready',
                          ),
                        'Refund diajukan; menunggu checker.',
                      )
                    )
                      setPreview(null);
                  }}
                >
                  <FormField label="Jenis pengajuan">
                    <select name="mode">
                      <option value="new">{t('Pengajuan refund baru')}</option>
                      {preview.sourcePending > 0 && (
                        <option value="source">
                          {t('Review refund yang sudah diminta sumber')}
                        </option>
                      )}
                    </select>
                  </FormField>
                  <FormField label="Nominal refund (IDR)">
                    <input
                      name="amount"
                      type="number"
                      min={1}
                      required
                      defaultValue={preview.sourcePending || preview.remaining}
                    />
                  </FormField>
                  <FormField label="Alasan refund">
                    <textarea name="reason" required minLength={10} />
                  </FormField>
                  <button className="ptr-button" disabled={a.busy || a.unknown}>
                    {t('Ajukan refund untuk review')}
                  </button>
                </form>
              </div>
            )}
          </article>
        ))}
      {!data.bookings.some((b) => b.paid > 0) && (
        <Empty title="Belum ada pembayaran untuk direkonsiliasi" />
      )}
      <h2>{t('Antrean refund')}</h2>
      {data.refunds.map((r) => (
        <section className="ptr-card" key={r.id}>
          <span className="ptr-eyebrow">
            {r.id} · {r.bookingId}
          </span>
          <h3>{money(r.amount)}</h3>
          <Badge>{t(REFUND_STATES[r.status])}</Badge>
          <p>{r.reason}</p>
          {r.status === 'requested' &&
            data.ctx.capabilities.includes('refund_approve') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      approveAdminRefund(
                        r.id,
                        r.version,
                        field(f, 'decision') === 'approve',
                        field(f, 'reason'),
                      ),
                    'Keputusan refund tercatat.',
                  );
                }}
              >
                <FormField label="Keputusan checker">
                  <select name="decision">
                    <option value="approve">{t('Setujui')}</option>
                    <option value="reject">{t('Tolak')}</option>
                  </select>
                </FormField>
                <FormField label="Alasan keputusan">
                  <textarea name="reason" required minLength={10} />
                </FormField>
                <button
                  className="ptr-button"
                  disabled={a.busy || r.maker === data.ctx.principal}
                >
                  {t(
                    r.maker === data.ctx.principal
                      ? 'Tidak dapat menyetujui refund sendiri'
                      : 'Konfirmasi review refund',
                  )}
                </button>
              </form>
            )}
          {['approved', 'processing'].includes(r.status) &&
            data.ctx.capabilities.includes('reconcile') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      recordRefundEvidence(
                        r.id,
                        field(f, 'reference'),
                        uploaded(f),
                        field(f, 'event'),
                        field(f, 'reason'),
                      ),
                    'Bukti refund direkonsiliasi.',
                  );
                }}
              >
                <FormField label="Referensi transfer refund">
                  <input name="reference" minLength={8} required />
                </FormField>
                <FormField label="Event rekonsiliasi refund">
                  <input name="event" required minLength={8} />
                </FormField>
                <FileInput />
                <FormField label="Alasan rekonsiliasi">
                  <textarea name="reason" required minLength={10} />
                </FormField>
                <button className="ptr-button" disabled={a.busy}>
                  {t('Rekonsiliasi bukti refund demo')}
                </button>
              </form>
            )}
        </section>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
export function SettlementsPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    [preview, setPreview] = useState<PayoutPreview | null>(null);
  return (
    <>
      <p className="ptr-notice">
        {t(
          'Maker dan Checker wajib berbeda aktor. Status paid hanya setelah referensi dan bukti transfer direkonsiliasi.',
        )}
      </p>
      {data.ctx.capabilities.includes('payout_make') && (
        <button
          className="ptr-button"
          disabled={a.busy}
          onClick={() =>
            a.run(
              async () => setPreview(await previewPayout()),
              'Preview batch siap.',
              false,
            )
          }
        >
          {t('Preview batch payout')}
        </button>
      )}
      {preview && (
        <section className="ptr-card mt-5">
          <h2>{t('Eligibility payout')}</h2>
          <div
            className="ptr-table-region"
            role="region"
            aria-label={t('Eligibility payout')}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {[
                    'Listing',
                    'Hak eligible IDR',
                    'Rekening snapshot',
                    'Status eligibility',
                  ].map((v) => (
                    <th key={v}>{t(v)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.items.map((i) => (
                  <tr key={i.key}>
                    <td>{i.name}</td>
                    <td>{money(i.amount)}</td>
                    <td>
                      {i.bank
                        ? `•••• ${i.bank.last4} · v${i.bank.version}`
                        : '—'}
                    </td>
                    <td>{t(i.heldReason ?? 'Eligible')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {t('Total batch eligible')}: <strong>{money(preview.total)}</strong>
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await a.run(
                  (id) =>
                    createPayoutBatch(
                      preview,
                      field(f, 'reason'),
                      id,
                      new URLSearchParams(window.location.search).get(
                        'scenario',
                      ) ?? 'ready',
                    ),
                  'Batch dibuat; menunggu checker.',
                )
              )
                setPreview(null);
            }}
          >
            <FormField label="Alasan pembuatan batch">
              <textarea name="reason" required minLength={10} />
            </FormField>
            <button
              className="ptr-button"
              disabled={a.busy || a.unknown || preview.total <= 0}
            >
              {t('Buat batch untuk checker')}
            </button>
          </form>
        </section>
      )}
      {data.batches.map((b) => (
        <section className="ptr-card mt-5" key={b.id}>
          <span className="ptr-eyebrow">
            {b.id} · v{b.version}
          </span>
          <h2>{money(b.total)}</h2>
          <Badge>{t(BATCH_STATES[b.status])}</Badge>
          <p>
            {t('Maker')}:{' '}
            {data.ctx.actors.find((v) => v.id === b.maker)?.name ?? b.maker}
          </p>
          <details>
            <summary>{t('Rincian item & rekening')}</summary>
            {b.items.map((i) => (
              <p key={i.key}>
                {i.name} · {money(i.amount)} · •••• {i.bank?.last4} · v
                {i.bank?.version}
              </p>
            ))}
          </details>
          {b.maker === data.ctx.principal && (
            <p className="ptr-muted">
              {t('Tidak dapat menyetujui batch sendiri')}
            </p>
          )}
          {b.status === 'review' &&
            data.ctx.capabilities.includes('payout_approve') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      approvePayoutBatch(
                        b.id,
                        b.version,
                        field(f, 'decision') === 'approve',
                        field(f, 'reason'),
                      ),
                    'Keputusan checker tercatat.',
                  );
                }}
              >
                <FormField label="Keputusan checker">
                  <select name="decision">
                    <option value="approve">{t('Setujui batch')}</option>
                    <option value="reject">{t('Tolak batch')}</option>
                  </select>
                </FormField>
                <FormField label="Alasan keputusan">
                  <textarea name="reason" required minLength={10} />
                </FormField>
                <button
                  className="ptr-button"
                  disabled={a.busy || b.maker === data.ctx.principal}
                >
                  {t(
                    b.maker === data.ctx.principal
                      ? 'Tidak dapat menyetujui batch sendiri'
                      : 'Konfirmasi keputusan batch',
                  )}
                </button>
              </form>
            )}
          {b.status === 'approved' &&
            data.ctx.capabilities.includes('payout_record') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      recordTransfer(
                        b.id,
                        field(f, 'reference'),
                        uploaded(f),
                        field(f, 'reason'),
                      ),
                    'Bukti transfer tercatat; belum paid.',
                  );
                }}
              >
                <FormField label="Referensi transfer unik">
                  <input name="reference" required minLength={8} />
                </FormField>
                <FileInput />
                <FormField label="Catatan transfer">
                  <textarea name="reason" required minLength={10} />
                </FormField>
                <button className="ptr-button" disabled={a.busy}>
                  {t('Catat bukti transfer demo')}
                </button>
              </form>
            )}
          {b.status === 'processing' &&
            data.ctx.capabilities.includes('reconcile') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      reconcilePayout(
                        b.id,
                        field(f, 'event'),
                        field(f, 'reason'),
                      ),
                    'Payout direkonsiliasi paid pada sumber.',
                  );
                }}
              >
                <FormField label="Event ID transfer">
                  <input name="event" required minLength={8} />
                </FormField>
                <FormField label="Alasan rekonsiliasi">
                  <textarea name="reason" required minLength={10} />
                </FormField>
                <button
                  className="ptr-button"
                  disabled={a.busy || b.maker === data.ctx.principal}
                >
                  {t('Rekonsiliasi hasil transfer demo')}
                </button>
              </form>
            )}
        </section>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
