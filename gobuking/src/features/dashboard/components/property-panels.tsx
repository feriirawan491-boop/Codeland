'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import { INQUIRY_STATUS_LABELS } from '@/features/venue/lib/config';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { listSaved, removeSaved } from '../lib/saved';
import {
  useResource,
  ResourceState,
  Empty,
  FormError,
  errorMessage,
} from './shared';
export function SavedPanel() {
  const { t } = useI18n(),
    [category, setCategory] = useState(''),
    r = useResource(() => listSaved(), 'saved');
  const rows = r.data?.filter((v) => !category || v.category === category);
  return (
    <>
      <label className="usr-short">
        {t('Kategori')}
        <select
          aria-label={t('Kategori')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('Semua kategori')}</option>
          {['hotel', 'home', 'mice', 'wedding'].map((v) => (
            <option key={v} value={v}>
              {v === 'home'
                ? 'Home Rental'
                : v === 'wedding'
                  ? 'Wedding Venue'
                  : v.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <ResourceState {...r} retry={r.reload} />
      {rows && !rows.length && <Empty title="Belum ada properti tersimpan" />}
      <div className="usr-two">
        {rows?.map((v) => (
          <article className="usr-card" key={v.id}>
            <div className="usr-saved-photo">
              <Image
                src={`/images/${v.image}.jpg`}
                alt=""
                fill
                sizes="(max-width:1023px) 85vw, 360px"
              />
            </div>
            <h3>{v.name}</h3>
            <p>{v.area}</p>
            <p>
              {t(
                v.active
                  ? 'Harga dan ketersediaan terbaru ditampilkan saat detail dibuka.'
                  : 'Properti sedang tidak tersedia.',
              )}
            </p>
            <div className="usr-actions">
              {v.active && (
                <Link href={v.href} className="usr-button">
                  {t('Lihat properti')}
                  <ArrowUpRight size={16} />
                </Link>
              )}
              <button
                className="usr-button secondary"
                onClick={() => {
                  removeSaved(v.id);
                  r.reload();
                }}
              >
                {t('Hapus dari favorit')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
export function InquiryPanel() {
  const { t } = useI18n(),
    r = useResource(() => inquiryAdapter.listMyInquiries(), 'inquiries'),
    [id, setId] = useState(''),
    [token, setToken] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <>
      <ResourceState {...r} retry={r.reload} />
      {r.data && !r.data.length && (
        <Empty
          title="Belum ada inquiry akun"
          description="Inquiry dan penawaran MICE atau Wedding Anda akan muncul di sini."
        />
      )}
      <div className="usr-list">
        {r.data?.map((v) => (
          <article className="usr-card" key={v.id}>
            <span className="usr-eyebrow">
              {v.service.toUpperCase()} · {v.id}
            </span>
            <h3>{v.spaceName}</h3>
            <p>{v.venueName}</p>
            <div className="usr-badges">
              <span>{t(INQUIRY_STATUS_LABELS[v.status])}</span>
              <span>
                {t(
                  v.verifiedAt
                    ? 'Kontak terverifikasi'
                    : 'Kontak belum terverifikasi',
                )}
              </span>
            </div>
            {v.quotes.length > 0 && (
              <p>
                {t('Versi penawaran')}: {v.quotes.at(-1)?.version} ·{' '}
                {t('Berlaku sampai')}:{' '}
                {new Date(v.quotes.at(-1)!.validUntil).toLocaleString()}
              </p>
            )}
            <Link className="usr-button" href={`/account/inquiries/${v.id}`}>
              {t('Lihat inquiry & penawaran')}
            </Link>
          </article>
        ))}
      </div>
      <details className="usr-card">
        <summary>{t('Klaim inquiry sebelumnya')}</summary>
        <p>
          {t(
            'Gunakan kontak yang sudah terverifikasi dan token akses inquiry. Email yang sama saja belum cukup untuk mengklaim.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await inquiryAdapter.claimInquiry(
                id,
                token || inquiryAdapter.getClaimToken(id) || '',
                crypto.randomUUID(),
              );
              setId('');
              setToken('');
              r.reload();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t('Kode inquiry')}
            <input
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </label>
          <label>
            {t('Token akses inquiry')}
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <p className="usr-muted">
            {t(
              'Token dari tab ini dapat digunakan otomatis jika masih tersedia.',
            )}
          </p>
          <button className="usr-button" disabled={busy}>
            {t('Verifikasi & klaim inquiry')}
          </button>
          <FormError message={error} />
        </form>
      </details>
    </>
  );
}
