'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n/locale-provider';
import { invitePartnerMember, managePartnerMember } from '../lib/management';
import {
  listPartnerTickets,
  createPartnerTicket,
  replyPartnerTicket,
  simulatePartnerSupport,
} from '../lib/support';
import { readPartnerFile } from '../lib/files';
import { partnerAdapter } from '../lib/adapter';
import type { Membership, PartnerListing, Activity } from '../lib/types';
import {
  usePartnerAction,
  Feedback,
  FormField,
  FileInput,
  field,
  uploaded,
  useResource,
  ResourceState,
  Empty,
} from './shared';
export function TeamPanel({
  members,
  listings,
  reload,
}: {
  members: Membership[];
  listings: PartnerListing[];
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = usePartnerAction(reload),
    [revoke, setRevoke] = useState<Membership | null>(null);
  return (
    <>
      <section className="ptr-card">
        <h2>{t('Undang staf usaha')}</h2>
        <p className="ptr-muted">
          {t(
            'Undangan demo tidak mengirim email. Salin ID undangan dan aktifkan melalui akun dengan email yang sesuai.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            if (
              await a.run(
                () =>
                  invitePartnerMember({
                    name: field(f, 'name'),
                    email: field(f, 'email'),
                    role: field(f, 'role'),
                    listingIds: f.getAll('listings').map(String),
                  }),
                'Undangan staf dicatat; aktivasi memerlukan verifikasi akun.',
              )
            )
              form.reset();
          }}
        >
          <div className="ptr-grid three">
            <FormField label="Nama staf">
              <input name="name" required minLength={2} />
            </FormField>
            <FormField label="Email staf">
              <input name="email" type="email" required />
            </FormField>
            <FormField label="Peran staf">
              <select name="role">
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
              </select>
            </FormField>
          </div>
          <fieldset>
            <legend>{t('Assignment listing')}</legend>
            <div className="ptr-grid">
              {listings.map((l) => (
                <label className="ptr-check" key={l.id}>
                  <input type="checkbox" name="listings" value={l.id} />
                  {l.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="ptr-button" disabled={a.busy}>
            {t('Undang staf')}
          </button>
        </form>
      </section>
      {members.map((m) => (
        <section className="ptr-card" key={m.id}>
          <div className="ptr-row">
            <div>
              <h3>{m.name}</h3>
              {m.status === 'invited' && (
                <small>
                  {t('ID undangan')}: {m.id}
                </small>
              )}
              <p>
                {m.role} ·{' '}
                {t(
                  m.status === 'active'
                    ? 'Aktif'
                    : m.status === 'invited'
                      ? 'Menunggu aktivasi'
                      : 'Dicabut',
                )}
              </p>
            </div>
            {m.role !== 'owner' && m.status !== 'revoked' && (
              <button
                className="ptr-button danger"
                onClick={() => setRevoke(m)}
              >
                {t('Cabut akses staf')}
              </button>
            )}
          </div>
          {m.role !== 'owner' && m.status === 'active' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await a.run(() =>
                  managePartnerMember(
                    m.id,
                    m.version,
                    'assignment',
                    f.getAll('listings').map(String),
                    crypto.randomUUID(),
                  ),
                );
              }}
            >
              <fieldset>
                <legend>{t('Assignment listing')}</legend>
                {listings.map((l) => (
                  <label className="ptr-check" key={l.id}>
                    <input
                      name="listings"
                      type="checkbox"
                      value={l.id}
                      defaultChecked={m.listingIds.includes(l.id)}
                    />
                    {l.name}
                  </label>
                ))}
              </fieldset>
              <button className="ptr-button secondary" disabled={a.busy}>
                {t('Simpan assignment')}
              </button>
            </form>
          )}
        </section>
      ))}
      <Feedback {...a} />
      <Dialog
        open={!!revoke}
        onOpenChange={(open) => {
          if (!open) setRevoke(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{t('Cabut akses staf?')}</DialogTitle>
          <DialogDescription>
            {t('Sesi aktif dan akses listing staf ini akan langsung ditolak.')}
          </DialogDescription>
          <button
            className="ptr-button danger"
            disabled={a.busy}
            onClick={async () => {
              if (
                revoke &&
                (await a.run(
                  () =>
                    managePartnerMember(
                      revoke.id,
                      revoke.version,
                      'revoke',
                      [],
                      crypto.randomUUID(),
                    ),
                  'Akses staf dicabut.',
                ))
              )
                setRevoke(null);
            }}
          >
            {t('Konfirmasi cabut akses')}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function SupportPanel({
  listings,
  activities,
}: {
  listings: PartnerListing[];
  activities: Activity[];
}) {
  const { t } = useI18n(),
    r = useResource(listPartnerTickets, 'partner-tickets'),
    a = usePartnerAction(r.reload),
    [command, setCommand] = useState<string | null>(null);
  return (
    <>
      <section className="ptr-card">
        <h2>{t('Eskalasi ke tim platform')}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form),
              id = command ?? crypto.randomUUID();
            setCommand(id);
            if (
              await a.run(
                () =>
                  createPartnerTicket(
                    {
                      subject: field(f, 'subject'),
                      body: field(f, 'body'),
                      reference: field(f, 'reference'),
                      listingId: field(f, 'listing'),
                    },
                    uploaded(f),
                    id,
                  ),
                'Tiket mitra tercatat.',
              )
            ) {
              form.reset();
              setCommand(null);
            }
          }}
        >
          <div className="ptr-grid">
            <FormField label="Listing terkait">
              <select name="listing">
                <option value="">{t('Usaha / umum')}</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Kode reservasi / inquiry (opsional)">
              <input name="reference" maxLength={100} />
            </FormField>
          </div>
          <FormField label="Subjek tiket">
            <input name="subject" required minLength={5} maxLength={120} />
          </FormField>
          <FormField label="Kronologi masalah">
            <textarea name="body" required minLength={10} maxLength={1000} />
          </FormField>
          <FileInput />
          <p className="ptr-muted">
            {t(
              'Resource dan aktivitas terkait dilampirkan otomatis, tanpa secret supplier.',
            )}
          </p>
          <button className="ptr-button" disabled={a.busy}>
            {t('Kirim tiket mitra')}
          </button>
          {command && (
            <button
              type="button"
              className="ptr-button secondary"
              onClick={() =>
                a.run(async () => {
                  const result = await partnerAdapter.resolveCommand(command);
                  if (!result)
                    throw new Error(
                      'Tiket belum tercatat. Periksa form sebelum mencoba kembali.',
                    );
                  setCommand(null);
                }, 'Tiket sudah tercatat.')
              }
              disabled={a.busy}
            >
              {t('Periksa hasil pengiriman')}
            </button>
          )}
        </form>
      </section>
      <ResourceState {...r} retry={r.reload} />
      {r.data && !r.data.length && <Empty title="Belum ada tiket mitra" />}
      {r.data?.map((ticket) => (
        <details className="ptr-card" key={ticket.id}>
          <summary>
            {ticket.subject} ·{' '}
            {t(
              ticket.status === 'open'
                ? 'Menunggu platform'
                : ticket.status === 'waiting_partner'
                  ? 'Menunggu balasan mitra'
                  : 'Tiket selesai',
            )}
          </summary>
          <span className="ptr-eyebrow">{ticket.id}</span>
          {ticket.messages.map((m) => (
            <div className="ptr-inset" key={m.id}>
              <strong>{m.actor}</strong>
              <small>{new Date(m.at).toLocaleString()}</small>
              <p>{t(m.body)}</p>
              {m.files.map((f) => (
                <button
                  key={f.id}
                  className="ptr-text-button"
                  onClick={() =>
                    a.run(async () => {
                      const file = readPartnerFile(
                          `ticket:${ticket.id}`,
                          f.id,
                          ticket.listingId ?? undefined,
                        ),
                        url = URL.createObjectURL(file),
                        link = document.createElement('a');
                      link.href = url;
                      link.download = file.name;
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }, 'Lampiran disiapkan.')
                  }
                >
                  {f.name}
                </button>
              ))}
            </div>
          ))}
          <details>
            <summary>{t('Konteks eskalasi')}</summary>
            {ticket.context.length ? (
              ticket.context.map((v, i) => (
                <p key={i}>
                  {v.at} · {v.resource} · {t(v.label)}
                </p>
              ))
            ) : (
              <p>{t('Belum ada aktivitas terkait sebelum tiket dibuat.')}</p>
            )}
          </details>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                f = new FormData(form);
              if (
                await a.run(() =>
                  replyPartnerTicket(
                    ticket.id,
                    field(f, 'body'),
                    uploaded(f),
                    crypto.randomUUID(),
                  ),
                )
              )
                form.reset();
            }}
          >
            <FormField label="Balasan mitra">
              <textarea name="body" required minLength={10} />
            </FormField>
            <FileInput />
            <button className="ptr-button secondary" disabled={a.busy}>
              {t('Kirim balasan')}
            </button>
          </form>
          <button
            className="ptr-text-button"
            disabled={a.busy}
            onClick={() =>
              a.run(
                () => simulatePartnerSupport(ticket.id),
                'Respons platform demo dicatat.',
              )
            }
          >
            {t('Simulasikan respons platform')}
          </button>
        </details>
      ))}
      {activities.length > 0 && (
        <section className="ptr-card">
          <h3>{t('Log aktivitas organisasi')}</h3>
          <div
            className="ptr-table-region"
            role="region"
            aria-label={t('Log aktivitas organisasi')}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {['Waktu', 'Aktor', 'Resource', 'Aktivitas'].map((h) => (
                    <th key={h}>{t(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 30).map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.at).toLocaleString()}</td>
                    <td>{v.actor}</td>
                    <td>{v.resource}</td>
                    <td>{t(v.action)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <Feedback {...a} />
    </>
  );
}
