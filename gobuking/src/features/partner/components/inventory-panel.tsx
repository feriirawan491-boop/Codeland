'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/locale-provider';
import type { PartnerListing, CalendarPreview } from '../lib/types';
import { previewCalendarChange, applyCalendarChange } from '../lib/listings';
import { partnerAdapter } from '../lib/adapter';
import {
  usePartnerAction,
  Feedback,
  FormField,
  field,
  money,
  Empty,
} from './shared';
export function InventoryPanel({
  listings,
  reload,
}: {
  listings: PartnerListing[];
  reload: () => void;
}) {
  const { t } = useI18n(),
    params = useSearchParams(),
    router = useRouter(),
    selected = params.get('listing') ?? listings[0]?.id ?? '',
    [preview, setPreview] = useState<CalendarPreview | null>(null),
    [command, setCommand] = useState<string | null>(null),
    a = usePartnerAction(reload);
  const l = listings.find((v) => v.id === selected);
  if (!l)
    return (
      <Empty
        title="Belum ada listing"
        description="Tambahkan listing sebelum mengelola kalender."
      />
    );
  return (
    <>
      <div className="ptr-notice">
        {t(
          'Perubahan stok dan tarif berlaku untuk pemesanan baru. Reservasi terkonfirmasi tetap dilayani.',
        )}
      </div>
      <section className="ptr-card">
        <FormField label="Listing / resource">
          <select
            aria-label={t('Listing / resource')}
            value={selected}
            onChange={(e) => {
              setPreview(null);
              router.replace(`?listing=${e.target.value}`, { scroll: false });
            }}
          >
            {listings.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.category.toUpperCase()}
              </option>
            ))}
          </select>
        </FormField>
        <p className="ptr-muted">
          {l.zone} · {t('Stok awal')}: {l.stock} · {l.ratePlan}
        </p>
        <form
          key={selected}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(
              async () => {
                setPreview(
                  await previewCalendarChange(selected, {
                    start: field(f, 'start'),
                    end: field(f, 'end'),
                    stock: Number(f.get('stock')),
                    price: Number(f.get('price')),
                    stopSell: f.get('stopSell') === 'on',
                    minStay: Number(f.get('minStay')),
                    buffer: Number(f.get('buffer')),
                    ratePlan: field(f, 'ratePlan'),
                  }),
                );
              },
              'Preview siap ditinjau.',
              false,
            );
          }}
        >
          <div className="ptr-grid three">
            <FormField label="Dari tanggal">
              <input
                name="start"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </FormField>
            <FormField label="Sampai tanggal (inklusif)">
              <input
                name="end"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </FormField>
            <FormField label="Stok per tanggal">
              <input
                name="stock"
                type="number"
                min={0}
                required
                defaultValue={l.stock}
              />
            </FormField>
            <FormField label="Tarif per malam / unit / paket (IDR)">
              <input
                name="price"
                type="number"
                min={1}
                required
                defaultValue={l.price}
              />
            </FormField>
            <FormField label="Minimum durasi (malam / hari)">
              <input
                name="minStay"
                type="number"
                min={1}
                required
                defaultValue={l.minStay}
              />
            </FormField>
            <FormField label="Buffer (malam hunian / menit kendaraan)">
              <input
                name="buffer"
                type="number"
                min={0}
                required
                defaultValue={l.buffer}
              />
            </FormField>
          </div>
          <FormField label="Rate plan">
            <input name="ratePlan" required defaultValue={l.ratePlan} />
          </FormField>
          <label className="ptr-check">
            <input name="stopSell" type="checkbox" />
            {t('Stop sell pada rentang ini')}
          </label>
          <button className="ptr-button" disabled={a.busy}>
            {t('Preview dampak perubahan')}
          </button>
        </form>
      </section>
      {preview && preview.listingId === selected && (
        <section className="ptr-card">
          <h3>{t('Preview perubahan kalender')}</h3>
          <p>
            {t('Versi')}: {preview.version.split(':').slice(0, 2).join(' · ')} ·{' '}
            {t('Berlaku sampai')}:{' '}
            {new Date(preview.expiresAt).toLocaleTimeString()}
          </p>
          <div
            className="ptr-table-region"
            role="region"
            aria-label={t('Preview perubahan kalender')}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {[
                    'Tanggal',
                    'Stok',
                    'Confirmed + hold',
                    'Tarif IDR',
                    'Penjualan',
                    'Validasi',
                  ].map((h) => (
                    <th key={h}>{t(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td>{r.stock}</td>
                    <td>{r.reserved}</td>
                    <td>{money(r.price)}</td>
                    <td>{t(r.stopSell ? 'Stop sell' : 'Terbuka')}</td>
                    <td>{t(r.conflict ?? 'Valid')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {t(
              'Baris konflik ditolak. Tidak ada pembatalan reservasi secara otomatis.',
            )}
          </p>
          <button
            className="ptr-button"
            disabled={a.busy || preview.rows.some((v) => v.conflict !== null)}
            onClick={async () => {
              const id = crypto.randomUUID();
              setCommand(id);
              if (
                await a.run(
                  () =>
                    applyCalendarChange(
                      preview,
                      id,
                      params.get('scenario') ?? 'ready',
                    ),
                  'Kalender dan tarif berhasil diperbarui.',
                )
              ) {
                setPreview(null);
                setCommand(null);
              } else setPreview(null);
            }}
          >
            {t('Konfirmasi perubahan kalender')}
          </button>
        </section>
      )}
      {command && (
        <button
          className="ptr-button secondary"
          disabled={a.busy}
          onClick={() =>
            a.run(async () => {
              const known = await partnerAdapter.resolveCommand(command);
              if (!known)
                throw new Error(
                  'Tindakan belum tercatat. Buat preview baru sebelum mencoba kembali.',
                );
              setCommand(null);
            }, 'Perubahan kalender telah tercatat.')
          }
        >
          {t('Periksa hasil perubahan')}
        </button>
      )}
      <Feedback {...a} />
    </>
  );
}
