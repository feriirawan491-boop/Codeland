'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  partnerStatement,
  simulatePartnerPayout,
  statementCsv,
} from '../lib/finance';
import type { PartnerContext } from '../lib/types';
import {
  useResource,
  ResourceState,
  usePartnerAction,
  Feedback,
  FormField,
  money,
} from './shared';
export function FinancePanel({ ctx }: { ctx: PartnerContext }) {
  const { t } = useI18n(),
    [start, setStart] = useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12)
        .toISOString()
        .slice(0, 10),
    ),
    [end, setEnd] = useState(new Date().toISOString().slice(0, 10)),
    r = useResource(() => partnerStatement(start, end), start + end),
    a = usePartnerAction(r.reload);
  return (
    <>
      <div className="ptr-toolbar">
        <FormField label="Awal periode">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </FormField>
        <FormField label="Akhir periode">
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </FormField>
      </div>
      <ResourceState {...r} retry={r.reload} />
      {r.data && (
        <>
          <div className="ptr-kpis">
            {[
              ['Penjualan bruto', r.data.grossSales],
              ['Komisi / potongan', r.data.deductions],
              ['Estimasi hak mitra', r.data.entitlement],
              ['Payout tercatat (demo)', r.data.paid],
            ].map(([label, value]) => (
              <div className="ptr-kpi" key={label}>
                <span>{t(String(label))}</span>
                <strong>{money(Number(value))}</strong>
              </div>
            ))}
          </div>
          <div className="ptr-notice">{t(r.data.policy)}</div>
          <section className="ptr-card">
            <h3>{t('Statement usaha')}</h3>
            <p>
              {start} — {end} · IDR ·{' '}
              {t('Periode berdasarkan waktu pencatatan fakta transaksi')} · UTC
            </p>
            <div
              className="ptr-table-region"
              role="region"
              aria-label={t('Statement usaha')}
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      'Tanggal',
                      'Referensi',
                      'Jenis',
                      'Bruto IDR',
                      'Pendanaan promo IDR',
                      'Potongan IDR',
                      'Hak mitra IDR',
                      'Payout IDR',
                    ].map((h) => (
                      <th key={h}>{t(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.data.lines.length ? (
                    r.data.lines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.at.slice(0, 10)}</td>
                        <td>{l.reference}</td>
                        <td>
                          {t(
                            l.kind === 'sale'
                              ? 'Penjualan'
                              : l.kind === 'refund'
                                ? 'Adjustment refund'
                                : 'Payout demo',
                          )}
                        </td>
                        <td>{money(l.gross)}</td>
                        <td>{money(l.funding ?? 0)}</td>
                        <td>{money(l.deduction)}</td>
                        <td>{money(l.entitlement)}</td>
                        <td>{money(l.payout)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        {t('Belum ada fakta keuangan pada periode ini.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <dl className="ptr-totals">
              <div>
                <dt>{t('Pendanaan promo platform')}</dt>
                <dd>{money(r.data.funding)}</dd>
              </div>
              <div>
                <dt>{t('Reservasi dibatalkan pada periode ini')}</dt>
                <dd>{r.data.cancellations}</dd>
              </div>
              <div>
                <dt>{t('Refund tercatat')}</dt>
                <dd>{money(r.data.refunds)}</dd>
              </div>
              <div>
                <dt>{t('Saldo awal estimasi')}</dt>
                <dd>{money(r.data.opening)}</dd>
              </div>
              <div>
                <dt>{t('Saldo akhir estimasi')}</dt>
                <dd>{money(r.data.closing)}</dd>
              </div>
            </dl>
            <button
              className="ptr-button"
              disabled={a.busy}
              onClick={() =>
                a.run(async () => {
                  const fresh = await partnerStatement(start, end),
                    url = URL.createObjectURL(
                      new Blob([statementCsv(fresh)], {
                        type: 'text/csv;charset=utf-8;',
                      }),
                    ),
                    link = document.createElement('a');
                  link.href = url;
                  link.download = `statement-${start}-${end}.csv`;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }, 'Statement disiapkan.')
              }
            >
              {t('Unduh statement CSV')}
            </button>
          </section>
          {ctx.membership.role === 'owner' && (
            <details className="ptr-card">
              <summary>{t('Simulasi payout lokal')}</summary>
              <p>
                {t(
                  'Mencatat payout contoh pada rekening aktif. Tidak ada transfer dana nyata. Refund berikutnya muncul sebagai adjustment baru.',
                )}
              </p>
              <button
                className="ptr-button secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(
                    () => simulatePartnerPayout(crypto.randomUUID()),
                    'Payout simulasi dicatat.',
                  )
                }
              >
                {t('Catat payout simulasi')}
              </button>
            </details>
          )}
        </>
      )}
      <Feedback {...a} />
    </>
  );
}
