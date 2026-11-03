'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import type { PartnerReservation, ServiceRecord } from '../lib/types';
import {
  decidePartnerRequest,
  recordPartnerService,
} from '../lib/reservations';
import { SERVICE_STATUS, PARTNER_CATEGORIES } from '../lib/config';
import { maskedEmail } from '../lib/sources';
import { PartnerError } from '../lib/store';
import {
  BOOKING_LABELS,
  PAYMENT_LABELS,
} from '@/features/hotel/lib/booking-labels';
import { CAR_STATUSES } from '@/features/car/lib/config';
import {
  usePartnerAction,
  usePartnerNow,
  Feedback,
  FormField,
  field,
  uploaded,
  FileInput,
  money,
  Empty,
} from './shared';
export function ReservationPanel({
  rows,
  services,
  operations,
  reload,
}: {
  rows: PartnerReservation[];
  services: ServiceRecord[];
  operations?: boolean;
  reload: () => void;
}) {
  const { t } = useI18n(),
    now = usePartnerNow(),
    params = useSearchParams(),
    router = useRouter(),
    [selected, setSelected] = useState<string | null>(params.get('detail')),
    a = usePartnerAction(reload),
    [error, setError] = useState('');
  const category = params.get('category') ?? '',
    status = params.get('status') ?? '',
    day = params.get('day') ?? '',
    page = Math.max(1, Number(params.get('page')) || 1),
    filtered = rows.filter(
      (r) =>
        (!category || r.category === category) &&
        (!status || r.status === status) &&
        (!day || r.start.slice(0, 10) === day),
    ),
    b = rows.find((r) => r.id === selected),
    service = services.find((v) => v.bookingId === selected),
    pages = Math.max(1, Math.ceil(filtered.length / 5)),
    current = Math.min(page, pages);
  function update(k: string, v: string) {
    const q = new URLSearchParams(params.toString());
    if (v) q.set(k, v);
    else q.delete(k);
    if (k !== 'page') q.delete('page');
    router.replace(`?${q}`, { scroll: false });
  }
  return (
    <>
      <div className="ptr-toolbar">
        <FormField label="Kategori">
          <select
            aria-label={t('Kategori')}
            value={category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">{t('Semua kategori')}</option>
            {['hotel', 'home', 'car'].map((v) => (
              <option value={v} key={v}>
                {PARTNER_CATEGORIES[v as 'hotel' | 'home' | 'car']}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status reservasi">
          <select
            aria-label={t('Status reservasi')}
            value={status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">{t('Semua status')}</option>
            {[
              'requested',
              'awaiting_payment',
              'confirmed',
              'in_use',
              'completed',
              'cancelled',
              'rejected',
              'expired',
              'exception',
            ].map((v) => (
              <option value={v} key={v}>
                {t(
                  v in CAR_STATUSES
                    ? CAR_STATUSES[v as keyof typeof CAR_STATUSES]
                    : v,
                )}
              </option>
            ))}
          </select>
        </FormField>
        {operations && (
          <FormField label="Tanggal mulai layanan">
            <input
              type="date"
              value={day}
              onChange={(e) => update('day', e.target.value)}
            />
          </FormField>
        )}
      </div>
      {!filtered.length && <Empty title="Belum ada reservasi sesuai filter" />}
      <div className="ptr-stack">
        {filtered.slice((current - 1) * 5, current * 5).map((r) => (
          <article className="ptr-card ptr-reservation" key={r.id}>
            <div>
              <span className="ptr-eyebrow">
                {PARTNER_CATEGORIES[r.category]} · {r.id}
              </span>
              <h3>{r.name}</h3>
              <p>
                {r.customerName} · {maskedEmail(r.email)}
              </p>
              <p>
                {r.start.replace('T', ' ')} — {r.end.replace('T', ' ')} ·{' '}
                {r.zone}
              </p>
              <div className="ptr-badges">
                <span>
                  {t(
                    r.source === 'car'
                      ? CAR_STATUSES[r.status as keyof typeof CAR_STATUSES]
                      : BOOKING_LABELS[r.status as keyof typeof BOOKING_LABELS],
                  )}
                </span>
                <span>
                  {t(PAYMENT_LABELS[r.payment as keyof typeof PAYMENT_LABELS])}
                </span>
                {operations && (
                  <span>
                    {t(
                      SERVICE_STATUS[
                        services.find((s) => s.bookingId === r.id)?.status ??
                          'scheduled'
                      ],
                    )}
                  </span>
                )}
              </div>
            </div>
            <div>
              <strong>{money(r.total)}</strong>
              <button
                className="ptr-button secondary"
                onClick={() => {
                  setSelected(r.id);
                  update('detail', r.id);
                }}
              >
                {t(operations ? 'Catat layanan' : 'Tinjau reservasi')}
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length > 5 && (
        <nav className="ptr-pagination" aria-label={t('Halaman reservasi')}>
          <button
            disabled={current <= 1}
            onClick={() => update('page', String(current - 1))}
          >
            {t('Sebelumnya')}
          </button>
          <span>
            {current} / {pages}
          </span>
          <button
            disabled={current >= pages}
            onClick={() => update('page', String(current + 1))}
          >
            {t('Berikutnya')}
          </button>
        </nav>
      )}
      <Feedback error={error || a.error} success={a.success} />
      <Dialog
        open={!!selected && !!b}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            update('detail', '');
            setError('');
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {t(operations ? 'Pemenuhan layanan' : 'Rincian reservasi')}
          </DialogTitle>
          <DialogDescription>
            {b?.name} · {b?.id}
          </DialogDescription>
          {b && (
            <div className="ptr-module ptr-inline">
              <p>
                {b.customerName} · {maskedEmail(b.email)}
              </p>
              <p>
                {b.start.replace('T', ' ')} — {b.end.replace('T', ' ')} ·{' '}
                {b.zone}
              </p>
              <p>
                <strong>{money(b.total)}</strong> ·{' '}
                {t(PAYMENT_LABELS[b.payment as keyof typeof PAYMENT_LABELS])}
              </p>
              {!operations && b.source === 'stay' && (
                <div className="ptr-notice">
                  {t(
                    'Hotel dan Home Rental langsung bayar. Tidak memerlukan persetujuan mitra.',
                  )}
                </div>
              )}
              {!operations &&
                b.source === 'car' &&
                b.status === 'requested' && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      setError('');
                      await a.run(async () => {
                        try {
                          await decidePartnerRequest(
                            b.id,
                            b.version,
                            field(f, 'decision') as 'approve' | 'reject',
                            field(f, 'reason'),
                            crypto.randomUUID(),
                            params.get('scenario') ?? 'ready',
                          );
                          setSelected(null);
                          update('detail', '');
                        } catch (e) {
                          if (e instanceof PartnerError && e.code === '409') {
                            setSelected(null);
                            update('detail', '');
                            reload();
                          }
                          throw e;
                        }
                      }, 'Keputusan request telah dicatat.');
                    }}
                  >
                    <FormField label="Keputusan request">
                      <select name="decision">
                        <option value="approve">
                          {t('Setujui kelayakan & alokasi')}
                        </option>
                        <option value="reject">
                          {t('Tolak dengan alasan')}
                        </option>
                      </select>
                    </FormField>
                    <FormField label="Alasan keputusan">
                      <textarea
                        name="reason"
                        required
                        minLength={10}
                        maxLength={1000}
                      />
                    </FormField>
                    <label className="ptr-check">
                      <input type="checkbox" required />
                      {t(
                        'Saya sudah memeriksa kelayakan, armada, dan konteks request.',
                      )}
                    </label>
                    <button className="ptr-button" disabled={a.busy}>
                      {t('Konfirmasi keputusan request')}
                    </button>
                  </form>
                )}
              {operations && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await a.run(
                      () =>
                        recordPartnerService(
                          b.id,
                          service?.version ?? 0,
                          field(f, 'action') as Parameters<
                            typeof recordPartnerService
                          >[2],
                          field(f, 'notes'),
                          uploaded(f),
                          crypto.randomUUID(),
                          params.get('scenario') ?? 'ready',
                        ),
                      'Catatan operasional tersimpan.',
                    );
                  }}
                >
                  <p>
                    {t('Status pemenuhan')}:{' '}
                    {t(SERVICE_STATUS[service?.status ?? 'scheduled'])}
                  </p>
                  {service?.instruction && <p>{service.instruction}</p>}
                  <FormField label="Tindakan operasional">
                    <select name="action">
                      <option value="instruction">
                        {t('Simpan instruksi layanan')}
                      </option>
                      {b.category === 'car' ? (
                        <>
                          <option value="pickup">Pickup</option>
                          <option value="return">Return</option>
                        </>
                      ) : (
                        <>
                          <option value="checkin">Check-in</option>
                          <option value="checkout">Check-out</option>
                        </>
                      )}
                      <option
                        value="no_show"
                        disabled={
                          Date.parse(
                            b.start +
                              ':00' +
                              (b.zone === 'Asia/Makassar'
                                ? '+08:00'
                                : '+07:00'),
                          ) > now
                        }
                      >
                        {t('Laporkan no-show untuk review')}
                      </option>
                      <option value="cancellation">
                        {t('Ajukan pembatalan oleh mitra')}
                      </option>
                    </select>
                  </FormField>
                  <p className="ptr-muted">
                    {t(
                      'No-show hanya tersedia setelah waktu mulai layanan, dengan bukti. Laporan dan pembatalan mitra perlu review.',
                    )}
                  </p>
                  <FormField label="Instruksi / catatan pemeriksaan">
                    <textarea
                      name="notes"
                      required
                      minLength={10}
                      defaultValue={
                        service?.notes || service?.instruction || ''
                      }
                    />
                  </FormField>
                  <FileInput />
                  <label className="ptr-check">
                    <input type="checkbox" required />
                    {t(
                      'Identitas, kondisi, dan checklist layanan sudah diperiksa.',
                    )}
                  </label>
                  <button className="ptr-button" disabled={a.busy}>
                    {t('Simpan catatan layanan')}
                  </button>
                </form>
              )}
              <Feedback {...a} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
