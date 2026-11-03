'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  listSupportTickets,
  getSupportTicket,
  createSupportTicket,
  resolveSupportSubmission,
  replySupportTicket,
  readSupportAttachment,
  simulateSupportResponse,
} from '../lib/support';
import { getAllMyBookings } from '../lib/bookings';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { TICKET_STATUS } from '../lib/config';
import type { TicketCategory } from '../lib/types';
import {
  ResourceState,
  useResource,
  Empty,
  FormError,
  errorMessage,
} from './shared';
export function SupportPanel({ ticketId }: { ticketId?: string }) {
  return ticketId ? <TicketThread id={ticketId} /> : <TicketList />;
}
function TicketList() {
  const { t } = useI18n(),
    router = useRouter(),
    r = useResource(
      async () => ({
        tickets: await listSupportTickets(),
        bookings: await getAllMyBookings(),
        inquiries: await inquiryAdapter.listMyInquiries(),
      }),
      'support',
    ),
    [category, setCategory] = useState<TicketCategory>('general'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    command = useRef<string | null>(null);
  return (
    <>
      <ResourceState {...r} retry={r.reload} />
      <div className="usr-two">
        <section className="usr-card">
          <h3>{t('Buat tiket bantuan')}</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const form = e.currentTarget,
                f = new FormData(form);
              command.current ??= crypto.randomUUID();
              setBusy(true);
              setError('');
              try {
                const ticket = await createSupportTicket(
                  {
                    subject: String(f.get('subject')),
                    category,
                    referenceId: String(f.get('referenceId') ?? ''),
                    body: String(f.get('body')),
                  },
                  f
                    .getAll('files')
                    .filter((v): v is File => v instanceof File && v.size > 0),
                  command.current,
                );
                command.current = null;
                router.push(`/account/support/${ticket.id}`);
              } catch (e) {
                setError(errorMessage(e));
                const known = await resolveSupportSubmission(command.current!);
                if (known) {
                  command.current = null;
                  router.push(`/account/support/${known.id}`);
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              {t('Kategori bantuan')}
              <select
                aria-label={t('Kategori bantuan')}
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
              >
                <option value="general">{t('Pertanyaan umum')}</option>
                <option value="booking">{t('Pesanan')}</option>
                <option value="inquiry">Inquiry</option>
              </select>
            </label>
            {category !== 'general' && (
              <label>
                {t('Referensi terkait')}
                <select
                  aria-label={t('Referensi terkait')}
                  name="referenceId"
                  required
                >
                  <option value="">{t('Pilih referensi')}</option>
                  {category === 'booking'
                    ? r.data?.bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} · {b.id}
                        </option>
                      ))
                    : r.data?.inquiries.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.spaceName} · {i.id}
                        </option>
                      ))}
                </select>
              </label>
            )}
            <label>
              {t('Subjek tiket')}
              <input name="subject" required minLength={5} maxLength={120} />
            </label>
            <label>
              {t('Pesan Anda')}
              <textarea name="body" required minLength={20} maxLength={3000} />
            </label>
            <label>
              {t('Lampiran privat (opsional)')}
              <input
                name="files"
                type="file"
                multiple
                accept="image/jpeg,image/png,application/pdf"
              />
            </label>
            <p className="usr-muted">
              {t(
                'Maksimal 3 file, masing-masing 5 MB. JPG, PNG, atau PDF. Pesan tetap tersimpan di form jika unggahan gagal.',
              )}
            </p>
            <FormError message={error} />
            <button className="usr-button" disabled={busy}>
              {t(busy ? 'Mengirim…' : 'Kirim tiket')}
            </button>
          </form>
        </section>
        <section>
          <h3>{t('Tiket saya')}</h3>
          {r.data && !r.data.tickets.length && (
            <Empty title="Belum ada tiket bantuan" />
          )}
          {r.data?.tickets.map((ticket) => (
            <Link
              className="usr-card usr-ticket-link"
              href={`/account/support/${ticket.id}`}
              key={ticket.id}
            >
              <span className="usr-eyebrow">{ticket.id}</span>
              <h3>{ticket.subject}</h3>
              <p>{t(TICKET_STATUS[ticket.status])}</p>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
function TicketThread({ id }: { id: string }) {
  const { t } = useI18n(),
    r = useResource(() => getSupportTicket(id), id),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    command = useRef<string | null>(null);
  async function attachment(fileId: string) {
    try {
      const file = await readSupportAttachment(id, fileId),
        url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <Link className="usr-link" href="/account/support">
        ← {t('Kembali ke tiket bantuan')}
      </Link>
      <ResourceState {...r} retry={r.reload} />
      {r.data && (
        <>
          <section className="usr-card">
            <span className="usr-eyebrow">{r.data.id}</span>
            <h3>{r.data.subject}</h3>
            <p>{t(TICKET_STATUS[r.data.status])}</p>
            {r.data.referenceId && <p>{r.data.referenceId}</p>}
            <div className="usr-thread">
              {r.data.messages.map((m) => (
                <article key={m.id} className={`usr-message ${m.actor}`}>
                  <strong>
                    {t(
                      m.actor === 'customer'
                        ? 'Anda'
                        : m.actor === 'support'
                          ? 'Tim bantuan'
                          : 'Pembaruan sistem',
                    )}
                  </strong>
                  <time>{new Date(m.at).toLocaleString()}</time>
                  <p>{t(m.body)}</p>
                  {m.files.map((f) => (
                    <button
                      key={f.id}
                      className="usr-link"
                      onClick={() => attachment(f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </article>
              ))}
            </div>
            {r.data.status !== 'closed' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  const form = e.currentTarget,
                    f = new FormData(form);
                  setBusy(true);
                  setError('');
                  command.current ??= crypto.randomUUID();
                  try {
                    await replySupportTicket(
                      id,
                      String(f.get('body')),
                      f
                        .getAll('files')
                        .filter(
                          (v): v is File => v instanceof File && v.size > 0,
                        ),
                      command.current,
                    );
                    command.current = null;
                    form.reset();
                    r.reload();
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  {t('Balasan Anda')}
                  <textarea
                    name="body"
                    required
                    minLength={5}
                    maxLength={3000}
                  />
                </label>
                <label>
                  {t('Lampiran privat (opsional)')}
                  <input
                    name="files"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,application/pdf"
                  />
                </label>
                <button className="usr-button" disabled={busy}>
                  {t('Kirim balasan')}
                </button>
              </form>
            )}
          </section>
          <details className="usr-card">
            <summary>{t('Simulasi layanan bantuan')}</summary>
            <p>
              {t('Kontrol ini hanya menjalankan respons CS pada demo lokal.')}
            </p>
            <div className="usr-actions">
              <button
                className="usr-button secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await simulateSupportResponse(id);
                    r.reload();
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t('Simulasikan balasan CS')}
              </button>
              <button
                className="usr-button secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await simulateSupportResponse(id, true);
                    r.reload();
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t('Selesaikan tiket demo')}
              </button>
            </div>
          </details>
        </>
      )}
      <FormError message={error} />
    </>
  );
}
