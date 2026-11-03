'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import type { AdminWorkspace } from '../lib/adapter';
import {
  saveCms,
  publishCms,
  toScheduledIso,
  updatePlatformPolicy,
  moderateReview,
} from '../lib/content';
import { PUBLIC_ASSETS } from '@/features/catalog/lib/public-state';
import { adminReport, reportCsv } from '../lib/reports';
import {
  useAdminResource,
  ResourceState,
  AdminFeedback,
  useAdminAction,
  FormField,
  field,
  Badge,
  Empty,
  money,
} from './shared';
export function CmsPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    [kind, setKind] = useState('banner');
  return (
    <>
      <section className="ptr-card">
        <h2>{t('Konten baru & promo dasar')}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              zone = field(f, 'zone');
            await a.run(
              () =>
                saveCms(null, 0, {
                  kind: kind as Parameters<typeof saveCms>[2]['kind'],
                  title: field(f, 'title'),
                  body: field(f, 'body'),
                  href: field(f, 'href'),
                  image: field(f, 'image'),
                  seoTitle: field(f, 'seoTitle'),
                  seoDescription: field(f, 'seoDescription'),
                  zone: zone as
                    'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura',
                  startsAt: toScheduledIso(field(f, 'start'), zone),
                  endsAt: toScheduledIso(field(f, 'end'), zone),
                  listingId: field(f, 'listing') || null,
                  discountPercent:
                    kind === 'promo' ? Number(f.get('discount')) : 0,
                  basis:
                    kind === 'promo'
                      ? (field(f, 'basis') as
                          'nightly_base' | 'unit_rate' | 'venue_quote')
                      : null,
                  fundedBy:
                    kind === 'promo'
                      ? (field(f, 'fundedBy') as 'platform' | 'partner')
                      : null,
                }),
              'Draft CMS tersimpan. Belum tampil publik.',
            );
          }}
        >
          <div className="ptr-grid">
            <FormField label="Jenis konten">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="banner">Banner</option>
                <option value="destination">{t('Destinasi')}</option>
                <option value="help">{t('Konten bantuan')}</option>
                <option value="policy">{t('Kebijakan')}</option>
                <option value="promo">Promo</option>
              </select>
            </FormField>
            <FormField label="Judul konten">
              <input name="title" required minLength={5} maxLength={120} />
            </FormField>
            <FormField label="URL publik tujuan">
              <input name="href" required defaultValue="/offers" />
            </FormField>
            <FormField label="Aset foto publik">
              <select name="image">
                {PUBLIC_ASSETS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Isi konten">
            <textarea name="body" required minLength={15} maxLength={2000} />
          </FormField>
          <div className="ptr-grid three">
            <FormField label="Awal jadwal (waktu lokal zona)">
              <input name="start" type="datetime-local" required />
            </FormField>
            <FormField label="Akhir jadwal (waktu lokal zona)">
              <input name="end" type="datetime-local" required />
            </FormField>
            <FormField label="Zona jadwal">
              <select name="zone">
                <option>Asia/Jakarta</option>
                <option>Asia/Makassar</option>
                <option>Asia/Jayapura</option>
              </select>
            </FormField>
          </div>
          <div className="ptr-grid">
            <FormField label="SEO title (maks. 70 karakter)">
              <input name="seoTitle" maxLength={70} />
            </FormField>
            <FormField label="SEO description (maks. 170 karakter)">
              <input name="seoDescription" maxLength={170} />
            </FormField>
          </div>
          {kind === 'promo' && (
            <div className="ptr-inset">
              <FormField label="Listing promo">
                <select name="listing" required>
                  <option value="">{t('Pilih listing')}</option>
                  {data.listings
                    .filter((l) => l.status === 'published')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {l.category}
                      </option>
                    ))}
                </select>
              </FormField>
              <div className="ptr-grid">
                <FormField label="Diskon (%)">
                  <input
                    name="discount"
                    type="number"
                    min={1}
                    max={100}
                    required
                  />
                </FormField>
                <FormField label="Dasar diskon">
                  <select name="basis" required>
                    <option value="nightly_base">
                      {t('Tarif dasar menginap')}
                    </option>
                    <option value="unit_rate">
                      {t('Tarif per unit kendaraan')}
                    </option>
                    <option value="venue_quote">
                      {t('Quote venue (pembahasan)')}
                    </option>
                  </select>
                </FormField>
                <FormField label="Penanggung diskon">
                  <select name="fundedBy" required>
                    <option value="platform">Platform</option>
                    <option value="partner">{t('Mitra')}</option>
                  </select>
                </FormField>
              </div>
            </div>
          )}
          <button className="ptr-button" disabled={a.busy}>
            {t('Simpan draft CMS')}
          </button>
        </form>
      </section>
      {!data.cms.length && <Empty title="Belum ada konten CMS" />}
      {data.cms.map((c) => (
        <article className="ptr-card" key={c.id}>
          <Badge>
            {t(
              c.status === 'draft'
                ? 'DRAFT · Belum publik'
                : c.status === 'published'
                  ? 'Published / scheduled'
                  : 'Diarsipkan',
            )}
          </Badge>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
          <p>
            {new Date(c.startsAt).toLocaleString()} —{' '}
            {new Date(c.endsAt).toLocaleString()} · {c.zone}
          </p>
          {c.kind === 'promo' && (
            <p>
              {c.discountPercent}% · {c.basis} · {t('Ditanggung')}: {c.fundedBy}
            </p>
          )}
          <details>
            <summary>{t('Preview draft & metadata')}</summary>
            <div className="ptr-notice">
              {t('PREVIEW DRAFT · Bukan halaman publik')}
            </div>
            <h4>{c.seoTitle || c.title}</h4>
            <p>{c.seoDescription || c.body}</p>
            <p>{c.href}</p>
          </details>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  publishCms(
                    c.id,
                    c.version,
                    field(f, 'action') === 'publish',
                    field(f, 'reason'),
                  ),
                'Status publikasi CMS diperbarui.',
              );
            }}
          >
            <FormField label="Tindakan publikasi">
              <select name="action">
                <option value="publish">{t('Publish sesuai jadwal')}</option>
                <option value="archive">{t('Arsipkan')}</option>
              </select>
            </FormField>
            <FormField label="Alasan publikasi">
              <textarea name="reason" minLength={10} required />
            </FormField>
            <button className="ptr-button secondary" disabled={a.busy}>
              {t('Konfirmasi publikasi CMS')}
            </button>
          </form>
        </article>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
export function SettingsPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    router = useRouter(),
    a = useAdminAction(reload),
    [dirty, setDirty] = useState(false),
    [leave, setLeave] = useState<string | null>(null),
    [diff, setDiff] = useState<
      Parameters<typeof updatePlatformPolicy>[1] | null
    >(null);
  const p = data.policy!;
  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const click = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest('a') : null;
      if (
        target?.href &&
        target.origin === location.origin &&
        target.pathname !== location.pathname
      ) {
        event.preventDefault();
        event.stopPropagation();
        setLeave(target.pathname + target.search);
      }
    };
    window.addEventListener('beforeunload', before);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', before);
      document.removeEventListener('click', click, true);
    };
  }, [dirty]);
  return (
    <>
      <section className="ptr-card">
        <h2>
          {t('Kebijakan platform berversi')} · v{p.version}
        </h2>
        <p className="ptr-notice">
          {t(
            'Perubahan berlaku untuk data baru setelah waktu efektif. SLA inquiry dan policy snapshot reservasi lama tidak ditulis ulang.',
          )}
        </p>
        <form
          onChange={() => {
            setDirty(true);
            setDiff(null);
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const value = {
              commissionBps: Math.round(Number(f.get('commission')) * 100),
              venueSlaHours: Number(f.get('sla')),
              cutoffHour: Number(f.get('cutoff')),
              refundReviewHours: Number(f.get('refundHours')),
              effectiveAt: new Date(field(f, 'effective')).toISOString(),
              scope: 'future_only' as const,
              categories: {
                hotel: f.get('hotel') === 'on',
                home: f.get('home') === 'on',
                car: f.get('car') === 'on',
                mice: f.get('mice') === 'on',
                wedding: f.get('wedding') === 'on',
              },
              note: field(f, 'reason'),
            };
            if (!diff) {
              setDiff(value);
              return;
            }
            if (
              await a.run(
                () => updatePlatformPolicy(p.version, value),
                'Konfigurasi baru tersimpan tanpa mengubah snapshot lama.',
              )
            ) {
              setDirty(false);
              setDiff(null);
            }
          }}
        >
          <div className="ptr-grid">
            <FormField label="Komisi default (%)">
              <input
                name="commission"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={p.commissionBps / 100}
                required
                onChange={() => setDiff(null)}
              />
            </FormField>
            <FormField label="SLA inquiry baru (jam)">
              <input
                name="sla"
                type="number"
                min={1}
                max={720}
                defaultValue={p.venueSlaHours}
                required
                onChange={() => setDiff(null)}
              />
            </FormField>
            <FormField label="Cut-off (jam 0–23)">
              <input
                name="cutoff"
                type="number"
                min={0}
                max={23}
                defaultValue={p.cutoffHour}
                required
                onChange={() => setDiff(null)}
              />
            </FormField>
            <FormField label="Target review refund (jam)">
              <input
                name="refundHours"
                type="number"
                min={1}
                max={720}
                defaultValue={p.refundReviewHours}
                required
                onChange={() => setDiff(null)}
              />
            </FormField>
            <FormField label="Waktu efektif (lokal perangkat)">
              <input name="effective" type="datetime-local" required />
            </FormField>
          </div>
          <fieldset>
            <legend>{t('Penjualan baru per kategori')}</legend>
            <div className="ptr-actions">
              {Object.entries(p.categories).map(([cat, value]) => (
                <label className="ptr-check" key={cat}>
                  <input name={cat} type="checkbox" defaultChecked={value} />
                  {cat.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>
          <FormField label="Alasan & dampak perubahan">
            <textarea name="reason" required minLength={10} />
          </FormField>
          {diff && (
            <div className="ptr-inset">
              <h3>{t('Sebelum → sesudah')}</h3>
              <p>
                {t('Komisi')}: {p.commissionBps / 100}% →{' '}
                {diff.commissionBps / 100}%
              </p>
              <p>
                SLA: {p.venueSlaHours} → {diff.venueSlaHours} {t('jam')}
              </p>
              <p>
                Cut-off: {p.cutoffHour} → {diff.cutoffHour}
              </p>
              <p>
                {t('Waktu efektif')}:{' '}
                {new Date(diff.effectiveAt).toLocaleString()}
              </p>
              <p>
                {t('Target review refund')}: {p.refundReviewHours} →{' '}
                {diff.refundReviewHours} {t('jam')}
              </p>
              {Object.entries(diff.categories).map(([cat, value]) => (
                <p key={cat}>
                  {cat.toUpperCase()}:{' '}
                  {String(p.categories[cat as keyof typeof p.categories])} →{' '}
                  {String(value)}
                </p>
              ))}
              <p>
                {t('Kasus berjalan mempertahankan waktu dan kebijakan semula.')}
              </p>
            </div>
          )}
          <button className="ptr-button" disabled={a.busy}>
            {t(
              diff
                ? 'Konfirmasi konfigurasi baru'
                : 'Preview dampak konfigurasi',
            )}
          </button>
        </form>
      </section>
      <AdminFeedback {...a} />
      <Dialog
        open={!!leave}
        onOpenChange={(open) => {
          if (!open) setLeave(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{t('Tinggalkan perubahan belum disimpan?')}</DialogTitle>
          <DialogDescription>
            {t('Perubahan konfigurasi Anda belum diterapkan.')}
          </DialogDescription>
          <button
            className="ptr-button danger"
            onClick={() => {
              const href = leave;
              setDirty(false);
              setLeave(null);
              if (href) router.push(href);
            }}
          >
            {t('Tinggalkan draft')}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function ModerationPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload);
  return (
    <>
      {!data.reviews.length && (
        <Empty title="Belum ada ulasan untuk moderasi" />
      )}
      {data.reviews.map((r) => (
        <article className="ptr-card" key={r.id}>
          <span className="ptr-score">{r.score}/10</span>
          <h2>{r.title}</h2>
          <p>{r.body}</p>
          <Badge>{r.status}</Badge>
          {r.reports.map((report) => (
            <p className="ptr-warning" key={report.id}>
              {t('Laporan mitra')}: {report.reason}
            </p>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  moderateReview(
                    r.id,
                    field(f, 'action') as 'publish' | 'retain' | 'reject',
                    field(f, 'guideline'),
                    field(f, 'reason'),
                  ),
                'Keputusan moderasi tercatat tanpa mengubah skor.',
              );
            }}
          >
            <div className="ptr-grid">
              <FormField label="Keputusan moderasi">
                <select name="action">
                  <option value="publish">{t('Publikasikan')}</option>
                  <option value="retain">{t('Pertahankan ulasan')}</option>
                  <option value="reject">
                    {t('Tolak karena pelanggaran')}
                  </option>
                </select>
              </FormField>
              <FormField label="Pedoman keputusan">
                <select name="guideline">
                  <option value="no_violation">
                    {t('Tidak ada pelanggaran')}
                  </option>
                  <option value="privacy">{t('Informasi pribadi')}</option>
                  <option value="abuse">
                    {t('Pelecehan / penyalahgunaan')}
                  </option>
                  <option value="irrelevant">
                    {t('Konten tidak relevan')}
                  </option>
                </select>
              </FormField>
            </div>
            <FormField label="Alasan berdasarkan pedoman">
              <textarea name="reason" required minLength={10} />
            </FormField>
            <button className="ptr-button" disabled={a.busy}>
              {t('Konfirmasi keputusan moderasi')}
            </button>
          </form>
          <details>
            <summary>{t('Riwayat keputusan')}</summary>
            {data.moderation
              .filter((v) => v.reviewId === r.id)
              .map((v) => (
                <p key={v.id}>
                  {v.actor} · {v.at} · {v.action} · {v.reason}
                </p>
              ))}
          </details>
        </article>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
export function ReportsPanel() {
  const { t } = useI18n(),
    [start, setStart] = useState('2000-01-01'),
    [end, setEnd] = useState(new Date().toISOString().slice(0, 10)),
    [basis, setBasis] = useState<'created' | 'service'>('created'),
    [zone, setZone] = useState('Asia/Jakarta'),
    r = useAdminResource(
      () => adminReport(start, end, basis, zone),
      `${start}:${end}:${basis}:${zone}`,
    ),
    a = useAdminAction(r.reload);
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
        <FormField label="Dasar tanggal laporan">
          <select
            value={basis}
            onChange={(e) => setBasis(e.target.value as 'created' | 'service')}
          >
            <option value="created">{t('Tanggal transaksi dibuat')}</option>
            <option value="service">{t('Tanggal mulai layanan')}</option>
          </select>
        </FormField>
        <FormField label="Zona laporan">
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            {['UTC', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </FormField>
      </div>
      <ResourceState
        loading={r.loading && !r.data}
        error={r.error}
        retry={r.reload}
      />
      {r.data && (
        <>
          <div className="ptr-kpis">
            {[
              ['GMV pembayaran', r.data.gmv],
              ['Penjualan bersih', r.data.netSales],
              ['Estimasi komisi platform', r.data.commission],
              ['Hak mitra', r.data.partnerEntitlement],
            ].map(([label, v]) => (
              <div className="ptr-kpi" key={label}>
                <span>{t(String(label))}</span>
                <strong>{money(Number(v))}</strong>
              </div>
            ))}
          </div>
          <p className="ptr-notice">
            {t(
              'GMV bukan pendapatan platform. Pipeline venue tidak masuk GMV. Refund dicadangkan dan payout aktual ditampilkan terpisah.',
            )}
          </p>
          <section className="ptr-card">
            <dl className="ptr-totals">
              <div>
                <dt>{t('Komisi sebelum biaya promo')}</dt>
                <dd>{money(r.data.grossCommission)}</dd>
              </div>
              <div>
                <dt>{t('Biaya promo platform')}</dt>
                <dd>{money(r.data.promoCost)}</dd>
              </div>
              <div>
                <dt>{t('Refund dicadangkan')}</dt>
                <dd>{money(r.data.refundReserved)}</dd>
              </div>
              <div>
                <dt>{t('Payout direkonsiliasi')}</dt>
                <dd>{money(r.data.payout)}</dd>
              </div>
              <div>
                <dt>{t('Estimasi kewajiban mitra')}</dt>
                <dd>{money(r.data.partnerPayable)}</dd>
              </div>
            </dl>
            <div
              className="ptr-table-region"
              role="region"
              aria-label={t('Rincian laporan pendapatan')}
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      'Referensi',
                      'Layanan',
                      'GMV IDR',
                      'Refund IDR',
                      'Komisi bps',
                    ].map((v) => (
                      <th key={v}>{t(v)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.data.rows.map((b) => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.category}</td>
                      <td>{money(b.paid)}</td>
                      <td>{money(b.refund)}</td>
                      <td>{b.commissionBps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="ptr-button"
              disabled={a.busy}
              onClick={() =>
                a.run(
                  async () => {
                    const data = await adminReport(start, end, basis, zone),
                      url = URL.createObjectURL(
                        new Blob([reportCsv(data)], {
                          type: 'text/csv;charset=utf-8;',
                        }),
                      ),
                      link = document.createElement('a');
                    link.href = url;
                    link.download = `platform-report-${start}-${end}.csv`;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  },
                  'Laporan disiapkan.',
                  false,
                )
              }
            >
              {t('Ekspor laporan CSV')}
            </button>
          </section>
        </>
      )}
      <AdminFeedback {...a} />
    </>
  );
}
