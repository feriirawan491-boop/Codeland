'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Plus, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  saveListingDraft,
  submitListingReview,
  setListingSales,
  missingListingFields,
} from '../lib/listings';
import { LISTING_STATUS, PARTNER_CATEGORIES } from '../lib/config';
import type { PartnerListing, PartnerContext } from '../lib/types';
import {
  usePartnerAction,
  Feedback,
  FormField,
  field,
  Empty,
  money,
} from './shared';
export function ListingPanel({
  listings,
  ctx,
  reload,
}: {
  listings: PartnerListing[];
  ctx: PartnerContext;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = usePartnerAction(reload),
    [edit, setEdit] = useState<PartnerListing | null | false>(false),
    [preview, setPreview] = useState(false),
    params = useSearchParams(),
    router = useRouter(),
    category = params.get('category') ?? '',
    status = params.get('status') ?? '';
  function filter(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete('page');
    router.replace(`?${p}`, { scroll: false });
  }
  if (edit !== false)
    return (
      <>
        <button
          className="ptr-text-button"
          onClick={() => {
            setEdit(false);
            setPreview(false);
          }}
        >
          ← {t('Kembali ke listing')}
        </button>
        <section className="ptr-card">
          <span className="ptr-eyebrow">
            {t('DRAFT → PREVIEW → REVIEW PLATFORM')}
          </span>
          <h2>{t(edit ? 'Edit draft listing' : 'Tambah listing')}</h2>
          <p>
            {t(
              'Kelengkapan disesuaikan dengan kategori. Persetujuan usaha tidak otomatis mempublikasikan listing.',
            )}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await a.run(() =>
                  saveListingDraft(
                    edit?.id ?? null,
                    {
                      category: field(f, 'category'),
                      name: field(f, 'name'),
                      address: field(f, 'address'),
                      description: field(f, 'description'),
                      capacity: Number(f.get('capacity')),
                      facilities: field(f, 'facilities')
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean),
                      price: Number(f.get('price')),
                      stock: Number(f.get('stock')),
                      minStay: Number(f.get('minStay')),
                      buffer: Number(f.get('buffer')),
                      ratePlan: field(f, 'ratePlan'),
                    },
                    edit?.version ?? 0,
                  ),
                )
              ) {
                setEdit(false);
                setPreview(false);
              }
            }}
          >
            <div className="ptr-grid">
              <FormField label="Kategori listing">
                <select
                  name="category"
                  defaultValue={edit?.category ?? 'hotel'}
                  onChange={() => setPreview(false)}
                  aria-label={t('Kategori listing')}
                >
                  {Object.entries(PARTNER_CATEGORIES).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nama listing">
                <input name="name" defaultValue={edit?.name ?? ''} />
              </FormField>
              <FormField label="Alamat listing">
                <input name="address" defaultValue={edit?.address ?? ''} />
              </FormField>
              <FormField label="Kapasitas tamu / kursi / peserta">
                <input
                  name="capacity"
                  type="number"
                  min={0}
                  defaultValue={edit?.capacity ?? 0}
                />
              </FormField>
              <FormField label="Tarif dasar (IDR)">
                <input
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={edit?.price ?? 0}
                />
              </FormField>
              <FormField label="Stok kamar / unit / kendaraan">
                <input
                  name="stock"
                  type="number"
                  min={0}
                  defaultValue={edit?.stock ?? 1}
                />
              </FormField>
              <FormField label="Minimum durasi (malam / hari)">
                <input
                  name="minStay"
                  type="number"
                  min={1}
                  defaultValue={edit?.minStay ?? 1}
                />
              </FormField>
              <FormField label="Buffer (malam hunian / menit kendaraan)">
                <input
                  name="buffer"
                  type="number"
                  min={0}
                  defaultValue={edit?.buffer ?? 0}
                />
              </FormField>
              <FormField label="Rate plan">
                <input
                  name="ratePlan"
                  defaultValue={edit?.ratePlan ?? 'Tarif standar'}
                />
              </FormField>
              <FormField label="Fasilitas / fitur (pisahkan dengan koma)">
                <input
                  name="facilities"
                  defaultValue={edit?.facilities.join(', ') ?? ''}
                />
              </FormField>
            </div>
            <FormField label="Deskripsi listing">
              <textarea
                name="description"
                defaultValue={edit?.description ?? ''}
              />
            </FormField>
            <div className="ptr-actions">
              <button className="ptr-button" disabled={a.busy}>
                {t('Simpan draft listing')}
              </button>
              <button
                type="button"
                className="ptr-button secondary"
                onClick={() => setPreview(!preview)}
              >
                <Eye size={17} />
                {t('Preview kelengkapan')}
              </button>
            </div>
            {preview && (
              <div className="ptr-notice">
                {t(
                  'Simpan draft untuk melihat preview nilai dan daftar kelengkapan pada kartu listing sebelum mengajukan review.',
                )}
              </div>
            )}
          </form>
        </section>
        <Feedback {...a} />
      </>
    );
  const rows = listings.filter(
    (l) =>
      (!category || l.category === category) &&
      (!status || l.status === status),
  );
  return (
    <>
      <div className="ptr-toolbar">
        <FormField label="Kategori">
          <select
            aria-label={t('Kategori')}
            value={category}
            onChange={(e) => filter('category', e.target.value)}
          >
            <option value="">{t('Semua kategori')}</option>
            {Object.entries(PARTNER_CATEGORIES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status listing">
          <select
            aria-label={t('Status listing')}
            value={status}
            onChange={(e) => filter('status', e.target.value)}
          >
            <option value="">{t('Semua status')}</option>
            {Object.entries(LISTING_STATUS).map(([id, label]) => (
              <option key={id} value={id}>
                {t(label)}
              </option>
            ))}
          </select>
        </FormField>
        {ctx.capabilities.includes('listing') && (
          <button className="ptr-button" onClick={() => setEdit(null)}>
            <Plus size={17} />
            {t('Tambah listing')}
          </button>
        )}
      </div>
      <div className="ptr-grid">
        {rows.map((l) => (
          <article className="ptr-card" key={l.id}>
            <div className="ptr-listing-image">
              <Image
                src={`/images/${l.image}.jpg`}
                alt=""
                fill
                sizes="(max-width:1023px) 90vw, 400px"
              />
              <span className="ptr-image-badge">
                {PARTNER_CATEGORIES[l.category]}
              </span>
            </div>
            <span className="ptr-badge">{t(LISTING_STATUS[l.status])}</span>
            <h3>{l.name}</h3>
            <p>{l.address}</p>
            <p>
              <strong>{money(l.price)}</strong> · {t('Stok')}: {l.stock} ·{' '}
              {l.zone}
            </p>
            <details>
              <summary>{t('Preview & kelengkapan')}</summary>
              <p>{l.description}</p>
              <p>{l.facilities.join(' · ')}</p>
              <p>
                {t('Kapasitas')}: {l.capacity} · {t('Versi')}: {l.version}
              </p>
              {missingListingFields(l).length > 0 ? (
                <p className="ptr-warning">
                  {t('Lengkapi')}:{' '}
                  {missingListingFields(l)
                    .map((v) => t(v))
                    .join(', ')}
                </p>
              ) : (
                <p>
                  {t('Informasi utama lengkap. Siap untuk diajukan review.')}
                </p>
              )}
            </details>
            {ctx.capabilities.includes('listing') && (
              <div className="ptr-actions">
                <button
                  className="ptr-button secondary"
                  onClick={() => setEdit(l)}
                >
                  {t('Edit draft')}
                </button>
                {l.status === 'draft' && (
                  <button
                    className="ptr-button"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(
                        () => submitListingReview(l.id),
                        'Listing diajukan untuk review platform.',
                      )
                    }
                  >
                    {t('Ajukan review listing')}
                  </button>
                )}
                {['published', 'paused'].includes(l.status) && (
                  <button
                    className="ptr-button secondary"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(() =>
                        setListingSales(
                          l.id,
                          l.status === 'published' ? 'pause' : 'resume',
                        ),
                      )
                    }
                  >
                    {t(
                      l.status === 'published'
                        ? 'Jeda penjualan'
                        : 'Buka penjualan',
                    )}
                  </button>
                )}
                {l.status !== 'archived' && (
                  <button
                    className="ptr-text-button"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(() => setListingSales(l.id, 'archive'))
                    }
                  >
                    {t('Arsipkan listing')}
                  </button>
                )}
              </div>
            )}
            {l.status === 'published' && l.publicPath && (
              <Link className="ptr-text-button" href={l.publicPath}>
                {t('Lihat halaman publik')}
                <ArrowUpRight size={15} />
              </Link>
            )}
          </article>
        ))}
      </div>
      {!rows.length && <Empty title="Belum ada listing sesuai filter" />}
      <Feedback {...a} />
    </>
  );
}
