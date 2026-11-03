'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  decideVerification,
  updateVerification,
  verificationBlockers,
  decideListing,
  listingDuplicates,
} from '../lib/verification';
import { readAdminFile } from '../lib/files';
import { PUBLIC_ASSETS } from '@/features/catalog/lib/public-state';
import { LOCATIONS } from '@/features/home/lib/search';
import type { AdminWorkspace } from '../lib/adapter';
import {
  AdminFeedback,
  useAdminAction,
  FormField,
  field,
  uploaded,
  FileInput,
  ReviewAction,
  Badge,
  Empty,
} from './shared';
async function downloadBusiness(
  id: string,
  fileId: string,
  kind: 'business' | 'verification' = 'business',
) {
  const file = await readAdminFile(kind, id, fileId),
    url = URL.createObjectURL(file),
    a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PartnerVerification({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    params = useSearchParams(),
    router = useRouter(),
    status = params.get('status') ?? '',
    rows = data.partners.filter((o) => !status || o.status === status);
  return (
    <>
      <FormField label="Status mitra">
        <select
          aria-label={t('Status mitra')}
          value={status}
          onChange={(e) =>
            router.replace(e.target.value ? `?status=${e.target.value}` : '?', {
              scroll: false,
            })
          }
        >
          <option value="">{t('Semua status')}</option>
          <option value="under_review">{t('Menunggu verifikasi')}</option>
          <option value="approved">{t('Aktif')}</option>
          <option value="suspended">{t('Ditangguhkan')}</option>
        </select>
      </FormField>
      {!rows.length && <Empty title="Belum ada pengajuan mitra" />}
      {rows.map((o) => {
        const blockers = verificationBlockers(data.ctx, o.id),
          v = data.verifications[o.id];
        return (
          <article className="ptr-card" key={o.id}>
            <div className="ptr-row">
              <div>
                <span className="ptr-eyebrow">
                  {o.id} · v{o.version}
                </span>
                <h2>{o.name}</h2>
                <Badge>
                  {t(
                    o.status === 'approved'
                      ? 'Aktif'
                      : o.status === 'under_review'
                        ? 'Menunggu verifikasi'
                        : o.status === 'suspended'
                          ? 'Ditangguhkan'
                          : 'Draft',
                  )}
                </Badge>
              </div>
              <ReviewAction label="Tinjau verifikasi" description={o.name}>
                <p>{o.address}</p>
                <p>
                  {t('Rekening aktif')}:{' '}
                  {o.bank ? `${o.bank.name} · •••• ${o.bank.last4}` : '—'}
                </p>
                {o.pendingBank && (
                  <p>
                    {t('Pengajuan rekening')}: {o.pendingBank.name} · ••••{' '}
                    {o.pendingBank.last4}
                  </p>
                )}
                <div>
                  {o.documents.map((f) => (
                    <button
                      className="ptr-text-button"
                      key={f.id}
                      onClick={() =>
                        a.run(
                          () => downloadBusiness(o.id, f.id),
                          'Dokumen privat disiapkan.',
                          false,
                        )
                      }
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                {data.verifications[o.id]?.evidence.map((f) => (
                  <button
                    className="ptr-text-button"
                    key={f.id}
                    onClick={() =>
                      a.run(
                        () => downloadBusiness(o.id, f.id, 'verification'),
                        'Dokumen privat disiapkan.',
                        false,
                      )
                    }
                  >
                    {f.name}
                  </button>
                ))}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await a.run(
                      () =>
                        updateVerification(
                          o.id,
                          o.version,
                          {
                            pic: f.get('pic') === 'on',
                            documents: f.get('documents') === 'on',
                            bank: f.get('bank') === 'on',
                            contract: f.get('contract') === 'on',
                          },
                          uploaded(f),
                          field(f, 'reason'),
                        ),
                      'Checklist verifikasi tersimpan.',
                    );
                  }}
                >
                  {[
                    ['pic', 'PIC dan profil diperiksa'],
                    ['documents', 'Dokumen usaha valid'],
                    ['bank', 'Rekening tervalidasi'],
                    ['contract', 'Perjanjian disetujui dan diperiksa'],
                  ].map(([key, label]) => (
                    <label className="ptr-check" key={key}>
                      <input
                        type="checkbox"
                        name={key}
                        defaultChecked={
                          v?.[
                            key as 'pic' | 'documents' | 'bank' | 'contract'
                          ] ?? false
                        }
                      />
                      {t(label)}
                    </label>
                  ))}
                  <FileInput />
                  <FormField label="Catatan pemeriksaan">
                    <textarea name="reason" minLength={10} required />
                  </FormField>
                  <button className="ptr-button" disabled={a.busy}>
                    {t('Simpan checklist & bukti')}
                  </button>
                </form>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await a.run(
                      () =>
                        decideVerification(
                          o.id,
                          o.version,
                          field(f, 'decision') as Parameters<
                            typeof decideVerification
                          >[2],
                          field(f, 'reason'),
                        ),
                      'Keputusan verifikasi tercatat.',
                    );
                  }}
                >
                  <FormField label="Keputusan verifikasi">
                    <select name="decision">
                      <option value="approve">{t('Aktivasi transaksi')}</option>
                      <option value="revision">{t('Minta revisi')}</option>
                      <option value="reject">{t('Tolak pengajuan')}</option>
                      {o.pendingBank && (
                        <option value="bank">
                          {t('Validasi rekening baru')}
                        </option>
                      )}
                      <option value="suspend">
                        {t('Suspend penjualan baru')}
                      </option>
                    </select>
                  </FormField>
                  <FormField label="Alasan keputusan">
                    <textarea name="reason" required minLength={10} />
                  </FormField>
                  <button className="ptr-button" disabled={a.busy}>
                    {t('Konfirmasi keputusan verifikasi')}
                  </button>
                </form>
                <AdminFeedback {...a} />
              </ReviewAction>
            </div>
            {blockers.length > 0 && (
              <div className="ptr-warning">
                <strong>{t('Syarat aktivasi belum lengkap')}</strong>
                <ul>
                  {blockers.map((v) => (
                    <li key={v}>{t(v)}</li>
                  ))}
                </ul>
              </div>
            )}
            <details>
              <summary>{t('Jejak keputusan verifikasi')}</summary>
              {v?.decisions.map((d) => (
                <p key={d.id}>
                  {d.actor} · {d.at} · {d.action} · {d.reason}
                </p>
              ))}
            </details>
          </article>
        );
      })}
      <AdminFeedback {...a} />
    </>
  );
}
export function CatalogModeration({
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
      {!data.listings.length && (
        <Empty title="Belum ada listing untuk ditinjau" />
      )}
      {data.listings.map((l) => {
        const duplicates = listingDuplicates(l.id);
        return (
          <article className="ptr-card" key={l.id}>
            <div className="ptr-row">
              <div>
                <span className="ptr-eyebrow">
                  {l.category.toUpperCase()} · {l.id}
                </span>
                <h2>{l.name}</h2>
                <Badge>
                  {t(
                    l.status === 'published'
                      ? 'Dipublikasikan'
                      : l.status === 'under_review'
                        ? 'Dalam review'
                        : l.status === 'paused'
                          ? 'Penjualan dijeda'
                          : 'Draft',
                  )}
                </Badge>
              </div>
              <ReviewAction label="Moderasi listing" description={l.name}>
                <p>{l.description}</p>
                <p>
                  {l.address} · {t('Kapasitas')}: {l.capacity} · {t('Stok')}:{' '}
                  {l.stock}
                </p>
                <p>
                  {t('Resource stok')}: {l.resourceId}
                </p>
                {duplicates.length > 0 && (
                  <div className="ptr-warning">
                    {t('Peringatan duplikasi inventori')}:{' '}
                    {duplicates.map((d) => d.name).join(', ')}
                  </div>
                )}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await a.run(
                      () =>
                        decideListing(
                          l.id,
                          l.version,
                          field(f, 'decision') as Parameters<
                            typeof decideListing
                          >[2],
                          field(f, 'reason'),
                          {
                            sharedWith: field(f, 'shared'),
                            locationId: field(f, 'location'),
                            image: field(f, 'image'),
                          },
                        ),
                      'Keputusan katalog tercatat.',
                    );
                  }}
                >
                  <FormField label="Keputusan katalog">
                    <select name="decision">
                      <option value="publish">{t('Publish listing')}</option>
                      <option value="revision">{t('Minta revisi')}</option>
                      <option value="reject">{t('Tolak listing')}</option>
                      <option value="suspend">{t('Suspend listing')}</option>
                    </select>
                  </FormField>
                  <FormField label="Resource bersama (bila duplikat)">
                    <select name="shared">
                      <option value="">{t('Resource listing ini')}</option>
                      {data.listings
                        .filter((d) => d.id !== l.id && d.orgId === l.orgId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} · {d.resourceId}
                          </option>
                        ))}
                    </select>
                  </FormField>
                  <FormField label="Lokasi katalog">
                    <select
                      name="location"
                      defaultValue={
                        l.zone === 'Asia/Makassar' ? 'bali' : 'jakarta'
                      }
                    >
                      {LOCATIONS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Foto publik yang disetujui">
                    <select name="image" defaultValue={l.image}>
                      {PUBLIC_ASSETS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </FormField>
                  <p className="ptr-muted">
                    {t(
                      'Hanya aset publik yang disetujui. Dokumen privat tidak menjadi foto katalog.',
                    )}
                  </p>
                  <FormField label="Alasan keputusan">
                    <textarea name="reason" required minLength={10} />
                  </FormField>
                  <label className="ptr-check">
                    <input type="checkbox" required />
                    {t(
                      'Lokasi, kebijakan, foto, kapasitas, dan stok bersama sudah diperiksa.',
                    )}
                  </label>
                  <button className="ptr-button" disabled={a.busy}>
                    {t('Konfirmasi moderasi listing')}
                  </button>
                </form>
                <AdminFeedback {...a} />
              </ReviewAction>
            </div>
            {duplicates.some((d) => d.resourceId !== l.resourceId) && (
              <p className="ptr-warning">
                {t('Duplikasi belum ditautkan ke stok bersama.')}
              </p>
            )}
          </article>
        );
      })}
      <AdminFeedback {...a} />
    </>
  );
}
