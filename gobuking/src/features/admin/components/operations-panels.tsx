'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/locale-provider';
import type { AdminWorkspace } from '../lib/adapter';
import {
  createAdminCase,
  updateAdminCase,
  assignVenuePic,
  replyPlatformTicket,
} from '../lib/operations';
import { restrictAccount } from '../lib/content';
import { readAdminFile } from '../lib/files';
import { maskedEmail } from '@/features/partner/lib/sources';
import {
  BOOKING_LABELS,
  PAYMENT_LABELS,
} from '@/features/hotel/lib/booking-labels';
import { CAR_STATUSES } from '@/features/car/lib/config';
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
  useAdminNow,
} from './shared';
function CaseFields({
  data,
  bookingId,
  ticketId,
  customerId,
  reload,
}: {
  data: AdminWorkspace;
  bookingId: string | null;
  ticketId?: string | null;
  customerId?: string | null;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await a.run(
          () =>
            createAdminCase({
              bookingId,
              ticketId: ticketId ?? null,
              customerId: customerId ?? null,
              kind: field(f, 'kind') as Parameters<
                typeof createAdminCase
              >[0]['kind'],
              ownerId: field(f, 'owner'),
              priority: field(f, 'priority') as 'normal' | 'high' | 'urgent',
              resolution: field(f, 'resolution') as
                'review' | 'relocation' | 'refund' | 'rebooking',
              alternative: field(f, 'alternative'),
              costBearer: field(f, 'cost') as
                'platform' | 'partner' | 'customer' | 'undecided',
              reason: field(f, 'reason'),
            }),
          'Kasus dan penanggung jawab tercatat.',
        );
      }}
    >
      <FormField label="Jenis kasus">
        <select name="kind" defaultValue={bookingId ? 'exception' : 'support'}>
          <option value="exception">Exception</option>
          <option value="overbooking">Overbooking</option>
          <option value="support">{t('Bantuan')}</option>
          <option value="no_show">No-show</option>
          <option value="cancellation">{t('Pembatalan mitra')}</option>
        </select>
      </FormField>
      <div className="ptr-grid">
        <FormField label="Penanggung jawab">
          <select name="owner" required>
            {data.actors
              .filter(
                (v) => v.role === 'operations' || v.role === 'super_admin',
              )
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        </FormField>
        <FormField label="Prioritas">
          <select name="priority">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </FormField>
      </div>
      <ResolutionFields />
      <FormField label="Alasan / kronologi kasus">
        <textarea name="reason" required minLength={10} />
      </FormField>
      <button className="ptr-button" disabled={a.busy}>
        {t('Buat kasus berpenanggung jawab')}
      </button>
      <AdminFeedback {...a} />
    </form>
  );
}
function ResolutionFields() {
  const { t } = useI18n();
  return (
    <>
      <FormField label="Rencana penyelesaian">
        <select name="resolution">
          <option value="review">{t('Review')}</option>
          <option value="relocation">{t('Relokasi')}</option>
          <option value="refund">Refund</option>
          <option value="rebooking">Rebooking</option>
          <option value="no_show_confirmed">{t('No-show dikonfirmasi')}</option>
          <option value="no_show_rejected">
            {t('Laporan no-show ditolak')}
          </option>
        </select>
      </FormField>
      <FormField label="Alternatif / rincian penyelesaian">
        <textarea name="alternative" minLength={10} required />
      </FormField>
      <FormField label="Penanggung biaya">
        <select name="cost" required>
          <option value="platform">Platform</option>
          <option value="partner">{t('Mitra')}</option>
          <option value="customer">{t('Pelanggan')}</option>
        </select>
      </FormField>
    </>
  );
}
export function ReservationsPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    params = useSearchParams(),
    router = useRouter(),
    [search, setSearch] = useState(''),
    category = params.get('category') ?? '',
    status = params.get('status') ?? '',
    page = Math.max(1, Number(params.get('page')) || 1);
  function update(k: string, v: string) {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    if (k !== 'page') p.delete('page');
    router.replace(`?${p}`, { scroll: false });
  }
  const rows = data.bookings.filter(
      (b) =>
        (!category || b.category === category) &&
        (!status || b.status === status) &&
        (!search ||
          `${b.id} ${b.name} ${b.customerName}`
            .toLowerCase()
            .includes(search.toLowerCase())),
    ),
    pages = Math.max(1, Math.ceil(rows.length / 5)),
    current = Math.min(page, pages);
  return (
    <>
      <div className="ptr-toolbar">
        <FormField label="Cari reservasi">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Kode, properti, atau nama pelanggan')}
          />
        </FormField>
        <FormField label="Kategori">
          <select
            value={category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">{t('Semua kategori')}</option>
            <option value="hotel">Hotel</option>
            <option value="home">Home Rental</option>
            <option value="car">Car Rental</option>
          </select>
        </FormField>
        <FormField label="Status reservasi">
          <select
            value={status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">{t('Semua status')}</option>
            <option value="exception">Exception</option>
            <option value="confirmed">{t('Terkonfirmasi')}</option>
            <option value="cancelled">{t('Dibatalkan')}</option>
          </select>
        </FormField>
      </div>
      {!rows.length && <Empty title="Belum ada reservasi sesuai filter" />}
      {rows.slice((current - 1) * 5, current * 5).map((b) => (
        <article className="ptr-card" key={b.id}>
          <div className="ptr-row">
            <div>
              <span className="ptr-eyebrow">
                {b.category.toUpperCase()} · {b.id}
              </span>
              <h3>{b.name}</h3>
              <p>
                {b.customerName} · {maskedEmail(b.email)}
              </p>
              <div className="ptr-badges">
                <Badge>
                  {t(
                    b.source === 'car'
                      ? CAR_STATUSES[b.status as keyof typeof CAR_STATUSES]
                      : BOOKING_LABELS[b.status as keyof typeof BOOKING_LABELS],
                  )}
                </Badge>
                <Badge>
                  {t(PAYMENT_LABELS[b.payment as keyof typeof PAYMENT_LABELS])}
                </Badge>
              </div>
              <p>
                {b.start} — {b.end} · {b.zone}
              </p>
            </div>
            <ReviewAction label="Tinjau transaksi" description={b.id}>
              <p>
                {t('Total transaksi')}: <strong>{money(b.total)}</strong>
              </p>
              {b.status === 'exception' && b.paid > 0 && (
                <div className="ptr-warning">
                  {t(
                    'Pembayaran berhasil, reservasi exception. Tinjau refund atau rebooking. Invoice konfirmasi tidak diterbitkan.',
                  )}
                </div>
              )}
              <h3>{t('Timeline sumber')}</h3>
              {b.timeline.map((e) => (
                <p className="adm-timeline" key={e.id}>
                  <small>{new Date(e.at).toLocaleString()}</small>
                  {t(e.label)}
                </p>
              ))}
              {data.cases
                .filter((c) => c.bookingId === b.id)
                .map((c) => (
                  <div className="ptr-inset" key={c.id}>
                    <strong>{c.id}</strong>
                    <p>
                      {data.actors.find((a) => a.id === c.ownerId)?.name} ·{' '}
                      {c.resolution} · {c.status}
                    </p>
                    <p>{c.alternative}</p>
                  </div>
                ))}
              {!data.cases.some(
                (c) => c.bookingId === b.id && c.status !== 'resolved',
              ) &&
                data.ctx.capabilities.includes('support') && (
                  <CaseFields
                    data={data}
                    bookingId={b.id}
                    customerId={b.customerId}
                    reload={reload}
                  />
                )}
            </ReviewAction>
          </div>
        </article>
      ))}
      {pages > 1 && (
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
    </>
  );
}
export function VenueAdminPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    now = useAdminNow(),
    a = useAdminAction(reload),
    [overdue, setOverdue] = useState(false);
  const rows = data.inquiries.filter(
    (v) => !overdue || (!!v.responseDueAt && Date.parse(v.responseDueAt) < now),
  );
  return (
    <>
      <label className="ptr-check">
        <input
          type="checkbox"
          checked={overdue}
          onChange={(e) => setOverdue(e.target.checked)}
        />
        {t('Hanya inquiry lewat SLA')}
      </label>
      {!rows.length && <Empty title="Belum ada inquiry pada antrean ini" />}
      {rows.map((v) => (
        <article className="ptr-card" key={v.id}>
          <span className="ptr-eyebrow">
            {v.id} · {v.service.toUpperCase()}
          </span>
          <h3>{v.spaceName}</h3>
          <p>
            {t('Masuk')}: {new Date(v.createdAt).toLocaleString()} · {t('PIC')}:{' '}
            {v.pic?.name ?? t('Belum ditugaskan')}
          </p>
          <p>
            {t('SLA')}:{' '}
            {v.responseDueAt ? new Date(v.responseDueAt).toLocaleString() : '—'}{' '}
            · {t('Terlambat (jam)')}:{' '}
            {v.responseDueAt
              ? Math.max(
                  0,
                  Math.floor((now - Date.parse(v.responseDueAt)) / 3600000),
                )
              : 0}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  assignVenuePic(v.id, field(f, 'actor'), field(f, 'reason')),
                'PIC diperbarui; waktu masuk dan SLA tetap.',
              );
            }}
          >
            <FormField label="PIC platform">
              <select name="actor">
                {data.actors
                  .filter((a) =>
                    ['super_admin', 'operations', 'partnership'].includes(
                      a.role,
                    ),
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </FormField>
            <FormField label="Alasan assignment">
              <textarea name="reason" required minLength={10} />
            </FormField>
            <button className="ptr-button secondary" disabled={a.busy}>
              {t('Assign PIC')}
            </button>
          </form>
          <details>
            <summary>{t('Penawaran & permintaan booking')}</summary>
            {v.quotes.map((q) => (
              <p key={q.id}>
                v{q.version} · {money(q.total)} · {q.status}
              </p>
            ))}
            {v.request && (
              <p>
                {v.request.id} · {v.request.status}
              </p>
            )}
            <p>
              {t(
                'Pipeline venue tidak dihitung sebagai GMV atau pendapatan platform.',
              )}
            </p>
          </details>
        </article>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
export function CustomersAdminPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    [query, setQuery] = useState(''),
    customers = [
      ...new Map(
        data.bookings.map((b) => [
          b.customerId,
          { id: b.customerId, name: b.customerName, email: b.email },
        ]),
      ).values(),
    ].filter(
      (c) =>
        !query ||
        `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <>
      <FormField label="Cari pelanggan terkait">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </FormField>
      {customers.map((c) => (
        <article className="ptr-card" key={c.id}>
          <h3>{c.name}</h3>
          <p>{maskedEmail(c.email)}</p>
          <details>
            <summary>{t('Transaksi & kasus terkait')}</summary>
            {data.bookings
              .filter((b) => b.customerId === c.id)
              .map((b) => (
                <p key={b.id}>
                  {b.id} · {b.name} · {b.status}
                </p>
              ))}
            {data.cases
              .filter((v) => v.customerId === c.id)
              .map((v) => (
                <p key={v.id}>
                  {v.id} · {v.status}
                </p>
              ))}
          </details>
          <ReviewAction label="Tinjau pembatasan akun" description={c.name}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await a.run(
                  () =>
                    restrictAccount(
                      c.id,
                      field(f, 'action') === 'restrict',
                      field(f, 'reason'),
                    ),
                  'Keputusan pembatasan tercatat.',
                );
              }}
            >
              <FormField label="Tindakan akun">
                <select name="action">
                  <option value="restrict">{t('Batasi pemesanan baru')}</option>
                  <option value="restore">
                    {t('Pulihkan pemesanan baru')}
                  </option>
                </select>
              </FormField>
              <p>{t('Akses pesanan lama dan bantuan tetap tersedia.')}</p>
              <FormField label="Alasan keputusan">
                <textarea name="reason" minLength={10} required />
              </FormField>
              <button className="ptr-button" disabled={a.busy}>
                {t('Konfirmasi tindakan akun')}
              </button>
            </form>
            <AdminFeedback {...a} />
          </ReviewAction>
        </article>
      ))}
    </>
  );
}
export function SupportAdminPanel({
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
      <h2>{t('Kasus platform')}</h2>
      {!data.cases.length && <Empty title="Belum ada kasus platform" />}
      {data.cases.map((c) => (
        <article className="ptr-card" key={c.id}>
          <span className="ptr-eyebrow">
            {c.id} · {c.priority} · {c.status}
          </span>
          <h3>{c.bookingId ?? c.ticketId ?? t('Kasus umum')}</h3>
          <p>
            {t('Penanggung jawab')}:{' '}
            {data.actors.find((v) => v.id === c.ownerId)?.name ?? c.ownerId}
          </p>
          <p>
            {c.alternative} · {t('Penanggung biaya')}: {c.costBearer}
          </p>
          <details>
            <summary>{t('Workspace kasus & catatan')}</summary>
            {c.notes.map((n) => (
              <div className="ptr-inset" key={n.id}>
                <Badge>
                  {t(
                    n.visibility === 'internal'
                      ? 'INTERNAL · Tidak dikirim ke pelanggan'
                      : 'Pesan pelanggan',
                  )}
                </Badge>
                <small>
                  {n.actor} · {n.at}
                </small>
                <p>{n.body}</p>
                {n.files.map((f) => (
                  <button
                    key={f.id}
                    className="ptr-text-button"
                    onClick={() =>
                      a.run(
                        async () => {
                          const file = await readAdminFile('case', c.id, f.id),
                            url = URL.createObjectURL(file),
                            link = document.createElement('a');
                          link.href = url;
                          link.download = file.name;
                          link.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        },
                        'Bukti kasus disiapkan.',
                        false,
                      )
                    }
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            ))}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await a.run(
                  () =>
                    updateAdminCase(
                      c.id,
                      c.version,
                      {
                        body: field(f, 'body'),
                        visibility: field(f, 'visibility') as
                          'internal' | 'customer',
                        status: field(f, 'status') as
                          'open' | 'waiting' | 'resolved',
                        resolution: field(f, 'resolution') as Parameters<
                          typeof updateAdminCase
                        >[2]['resolution'],
                        alternative: field(f, 'alternative'),
                        costBearer: field(f, 'cost') as Parameters<
                          typeof updateAdminCase
                        >[2]['costBearer'],
                      },
                      uploaded(f),
                    ),
                  'Kasus diperbarui.',
                );
              }}
            >
              <FormField label="Jenis catatan">
                <select name="visibility">
                  <option value="internal">{t('Internal')}</option>
                  <option value="customer">{t('Pesan pelanggan')}</option>
                </select>
              </FormField>
              <FormField label="Catatan / pesan">
                <textarea name="body" required minLength={10} />
              </FormField>
              <FormField label="Status kasus">
                <select name="status" defaultValue={c.status}>
                  <option value="open">Open</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                </select>
              </FormField>
              <ResolutionFields />
              <FileInput />
              <button className="ptr-button" disabled={a.busy}>
                {t('Simpan tindak lanjut kasus')}
              </button>
            </form>
          </details>
        </article>
      ))}
      <h2>{t('Tiket pelanggan & mitra')}</h2>
      {data.tickets.map((v) => (
        <details className="ptr-card" key={v.id}>
          <summary>
            {v.subject} · {v.status}
          </summary>
          {v.messages.map((m) => (
            <div className="ptr-inset" key={m.id}>
              <small>
                {m.actor} · {m.at}
              </small>
              <p>{m.body}</p>
              {m.files.map((f) => (
                <button
                  key={f.id}
                  className="ptr-text-button"
                  onClick={() =>
                    a.run(
                      async () => {
                        const file = await readAdminFile(
                          v.kind === 'customer'
                            ? 'customer_ticket'
                            : 'partner_ticket',
                          v.id,
                          f.id,
                        );
                        const url = URL.createObjectURL(file),
                          link = document.createElement('a');
                        link.href = url;
                        link.download = file.name;
                        link.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      },
                      'Dokumen privat disiapkan.',
                      false,
                    )
                  }
                >
                  {f.name}
                </button>
              ))}
            </div>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  replyPlatformTicket(
                    v.id,
                    field(f, 'body'),
                    f.get('close') === 'on',
                  ),
                'Balasan platform tercatat di tiket sumber.',
              );
            }}
          >
            <FormField label="Pesan untuk pelanggan / mitra">
              <textarea name="body" required minLength={10} />
            </FormField>
            <label className="ptr-check">
              <input type="checkbox" name="close" />
              {t('Tutup tiket dengan alasan ini')}
            </label>
            <button className="ptr-button secondary" disabled={a.busy}>
              {t('Kirim balasan platform')}
            </button>
          </form>
          <CaseFields
            data={data}
            bookingId={null}
            ticketId={v.id}
            reload={reload}
          />
        </details>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
