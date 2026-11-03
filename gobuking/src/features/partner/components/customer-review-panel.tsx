'use client';
import { useState, useDeferredValue } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  partnerCustomers,
  saveCustomerNote,
  partnerReviews,
  respondPartnerReview,
} from '../lib/management';
import { maskedEmail, maskedPhone } from '../lib/sources';
import {
  usePartnerAction,
  Feedback,
  FormField,
  field,
  useResource,
  ResourceState,
  Empty,
} from './shared';
export function CustomerPanel() {
  const { t } = useI18n(),
    r = useResource(partnerCustomers, 'customers'),
    a = usePartnerAction(r.reload),
    [query, setQuery] = useState(''),
    search = useDeferredValue(query.toLowerCase());
  return (
    <>
      <p>
        {t(
          'Kontak ditampilkan tersamarkan. Riwayat hanya mencakup organisasi dan assignment Anda.',
        )}
      </p>
      <FormField label="Cari pelanggan terkait">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Nama atau kontak pelanggan terkait')}
        />
      </FormField>
      <ResourceState {...r} retry={r.reload} />
      {r.data && !r.data.length && (
        <Empty title="Belum ada pelanggan terkait" />
      )}
      {r.data
        ?.filter(
          (c) =>
            !search ||
            `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search),
        )
        .map((c) => (
          <article className="ptr-card" key={c.id}>
            <h3>{c.name}</h3>
            <p>
              {maskedEmail(c.email)} · {maskedPhone(c.phone)}
            </p>
            <details>
              <summary>
                {t('Riwayat layanan organisasi ini')} ·{' '}
                {c.reservations.length + c.inquiries.length}
              </summary>
              {c.reservations.map((b) => (
                <p key={b.id}>
                  {b.id} · {b.name} · {b.start.slice(0, 10)}
                </p>
              ))}
              {c.inquiries.map((i) => (
                <p key={i.id}>
                  {i.id} · {i.spaceName}
                </p>
              ))}
            </details>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await a.run(() => saveCustomerNote(c.id, field(f, 'note')));
              }}
            >
              <FormField label="Catatan layanan privat">
                <textarea name="note" maxLength={1500} defaultValue={c.note} />
              </FormField>
              <button className="ptr-button secondary" disabled={a.busy}>
                {t('Simpan catatan pelanggan')}
              </button>
            </form>
          </article>
        ))}
      <Feedback {...a} />
    </>
  );
}
export function ReviewPanel() {
  const { t } = useI18n(),
    r = useResource(partnerReviews, 'partner-reviews'),
    a = usePartnerAction(r.reload);
  return (
    <>
      <p>
        {t(
          'Balas masukan atau laporkan pelanggaran untuk moderasi. Skor dan ulasan pelanggan tetap utuh.',
        )}
      </p>
      <ResourceState {...r} retry={r.reload} />
      {r.data && !r.data.length && (
        <Empty title="Belum ada ulasan terpublikasi" />
      )}
      {r.data?.map((v) => (
        <article className="ptr-card" key={v.id}>
          <span className="ptr-score">{v.score}/10</span>
          <h3>{v.title}</h3>
          <p>{v.body}</p>
          {v.reply && <blockquote>{v.reply}</blockquote>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(() =>
                respondPartnerReview(
                  v.id,
                  field(f, 'action') as 'reply' | 'report',
                  field(f, 'body'),
                ),
              );
            }}
          >
            <FormField label="Tindakan ulasan">
              <select name="action">
                <option value="reply">{t('Balas ulasan')}</option>
                <option value="report">{t('Laporkan pelanggaran')}</option>
              </select>
            </FormField>
            <FormField label="Balasan / alasan laporan">
              <textarea name="body" required minLength={10} maxLength={1000} />
            </FormField>
            <button className="ptr-button" disabled={a.busy}>
              {t('Kirim tanggapan')}
            </button>
          </form>
        </article>
      ))}
      <Feedback {...a} />
    </>
  );
}
