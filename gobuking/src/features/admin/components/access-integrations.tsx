'use client';
import { useI18n } from '@/components/i18n/locale-provider';
import { useState } from 'react';
import { manageAdminActor } from '../lib/content';
import {
  checkIntegration,
  replayIntegration,
  enterEmergency,
} from '../lib/integrations';
import type { AdminWorkspace } from '../lib/adapter';
import { ADMIN_ROLES } from '../lib/config';
import {
  AdminFeedback,
  useAdminAction,
  FormField,
  field,
  ReviewAction,
  Badge,
  Empty,
} from './shared';
export function IntegrationsPanel({
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
      {data.integrations.map((v) => (
        <article className="ptr-card" key={v.id}>
          <div className="ptr-row">
            <div>
              <h2>{v.name}</h2>
              <Badge>
                {t(
                  v.state === 'not_connected'
                    ? 'Belum terhubung'
                    : v.state === 'simulated_ok'
                      ? 'Simulasi sehat'
                      : 'Simulasi gangguan',
                )}
              </Badge>
              <p>
                {t('Terakhir diperiksa')}:{' '}
                {v.checkedAt ? new Date(v.checkedAt).toLocaleString() : '—'}
              </p>
            </div>
            <div className="ptr-actions">
              <button
                className="ptr-button secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(
                    () => checkIntegration(v.id, false),
                    'Pemeriksaan demo tercatat.',
                  )
                }
              >
                {t('Periksa status demo')}
              </button>
              <button
                className="ptr-button secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(
                    () => checkIntegration(v.id, true),
                    'Gangguan demo dicatat tanpa secret.',
                  )
                }
              >
                {t('Simulasikan gangguan')}
              </button>
            </div>
          </div>
          <p className="ptr-muted">
            {t(
              'Status ini berasal dari adapter lokal. Tidak ada panggilan ke provider nyata.',
            )}
          </p>
          {v.logs.map((l) => (
            <div className="ptr-inset" key={l.id}>
              <span className="ptr-eyebrow">
                Correlation ID: {l.correlationId}
              </span>
              <p>{l.message}</p>
              <small>{l.at}</small>
              {data.ctx.capabilities.includes('replay') && (
                <ReviewAction
                  label="Tinjau replay diagnostik"
                  description={l.correlationId}
                >
                  <p>
                    {t(
                      'Replay ini tidak mengulang debit, refund, atau payout. Koreksi uang harus melalui rekonsiliasi dan approval.',
                    )}
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      await a.run(
                        () => replayIntegration(v.id, l.id, field(f, 'reason')),
                        'Replay diagnostik tercatat sekali.',
                      );
                    }}
                  >
                    <FormField label="Alasan replay">
                      <textarea name="reason" minLength={10} required />
                    </FormField>
                    <button
                      className="ptr-button"
                      disabled={a.busy || l.replayed}
                    >
                      {t(
                        l.replayed
                          ? 'Sudah direkonsiliasi'
                          : 'Konfirmasi replay diagnostik',
                      )}
                    </button>
                  </form>
                  <AdminFeedback {...a} />
                </ReviewAction>
              )}
            </div>
          ))}
        </article>
      ))}
      <AdminFeedback {...a} />
    </>
  );
}
export function AccessPanel({
  data,
  reload,
}: {
  data: AdminWorkspace;
  reload: () => void;
}) {
  const { t } = useI18n(),
    a = useAdminAction(reload),
    [search, setSearch] = useState('');
  return (
    <>
      <section className="ptr-card">
        <h2>{t('Undang staf platform')}</h2>
        <p className="ptr-muted">
          {t(
            'Undangan demo diaktifkan melalui akun dengan email yang sama dan OTP. Tidak ada email nyata yang dikirim.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(
              () =>
                manageAdminActor(
                  null,
                  {
                    name: field(f, 'name'),
                    email: field(f, 'email'),
                    role: field(f, 'role') as keyof typeof ADMIN_ROLES,
                    orgIds:
                      field(f, 'org') === 'all' ? 'all' : [field(f, 'org')],
                    active: true,
                  },
                  field(f, 'reason'),
                ),
              'Undangan platform dicatat.',
            );
          }}
        >
          <div className="ptr-grid">
            <FormField label="Nama staf">
              <input name="name" required minLength={2} />
            </FormField>
            <FormField label="Email staf">
              <input name="email" type="email" required />
            </FormField>
            <FormField label="Peran platform">
              <select name="role">
                {Object.entries(ADMIN_ROLES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Lingkup organisasi">
              <select name="org">
                <option value="all">{t('Semua organisasi')}</option>
                {data.partners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Alasan pemberian akses">
            <textarea name="reason" minLength={10} required />
          </FormField>
          <button className="ptr-button" disabled={a.busy}>
            {t('Undang admin')}
          </button>
        </form>
      </section>
      {data.allActors.map((v) => (
        <section className="ptr-card" key={v.id}>
          <div className="ptr-row">
            <div>
              <h3>{v.name}</h3>
              <p>
                {ADMIN_ROLES[v.role]} ·{' '}
                {t(v.active ? 'Aktif' : 'Dinonaktifkan')} · v{v.version}
              </p>
              <small>
                {v.orgIds === 'all'
                  ? t('Semua organisasi')
                  : v.orgIds.join(' · ')}
              </small>
            </div>
            <ReviewAction label="Tinjau akses staf" description={v.name}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await a.run(
                    () =>
                      manageAdminActor(
                        v.id,
                        {
                          name: v.name,
                          email: v.email,
                          role: field(f, 'role') as keyof typeof ADMIN_ROLES,
                          orgIds:
                            field(f, 'org') === 'all'
                              ? 'all'
                              : [field(f, 'org')],
                          active: f.get('active') === 'on',
                        },
                        field(f, 'reason'),
                      ),
                    'Izin staf diperbarui; sesi lama mengikuti versi terbaru.',
                  );
                }}
              >
                <FormField label="Peran platform">
                  <select name="role" defaultValue={v.role}>
                    {Object.entries(ADMIN_ROLES).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Lingkup organisasi">
                  <select
                    name="org"
                    defaultValue={v.orgIds === 'all' ? 'all' : v.orgIds[0]}
                  >
                    <option value="all">{t('Semua organisasi')}</option>
                    {data.partners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <label className="ptr-check">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={v.active}
                  />
                  {t('Akses aktif')}
                </label>
                <FormField label="Alasan perubahan izin">
                  <textarea name="reason" minLength={10} required />
                </FormField>
                <label className="ptr-check">
                  <input type="checkbox" required />
                  {t(
                    'Saya memahami perubahan izin berlaku segera untuk sesi aktif.',
                  )}
                </label>
                <button className="ptr-button" disabled={a.busy}>
                  {t('Konfirmasi perubahan izin')}
                </button>
              </form>
              <AdminFeedback {...a} />
            </ReviewAction>
          </div>
        </section>
      ))}
      <section className="ptr-card">
        <h2>{t('Akses darurat tercatat')}</h2>
        <p>
          {t(
            'Akses darurat tidak meniadakan pemisahan Maker dan Checker atau kewajiban bukti keuangan.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(
              () => enterEmergency(field(f, 'reason')),
              'Akses darurat dicatat selama 15 menit.',
            );
          }}
        >
          <FormField label="Alasan akses darurat">
            <textarea name="reason" required minLength={10} />
          </FormField>
          <button className="ptr-button secondary" disabled={a.busy}>
            {t('Catat akses darurat')}
          </button>
        </form>
      </section>
      <section className="ptr-card">
        <h2>{t('Audit explorer')}</h2>
        <FormField label="Cari resource / correlation ID">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>
        <div
          className="ptr-table-region"
          role="region"
          aria-label={t('Audit platform')}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                {[
                  'Waktu',
                  'Aktor',
                  'Peran',
                  'Aktivitas',
                  'Resource',
                  'Correlation ID',
                  'Alasan',
                ].map((v) => (
                  <th key={v}>{t(v)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.audit
                .filter(
                  (v) =>
                    !search ||
                    `${v.resource} ${v.correlationId} ${v.action}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((v) => (
                  <tr key={v.id}>
                    <td>{v.at}</td>
                    <td>{v.actor}</td>
                    <td>{ADMIN_ROLES[v.role]}</td>
                    <td>{t(v.action)}</td>
                    <td>{v.resource}</td>
                    <td>{v.correlationId}</td>
                    <td>{v.reason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!data.audit.length && <Empty title="Belum ada aktivitas audit" />}
      </section>
      <AdminFeedback {...a} />
    </>
  );
}
