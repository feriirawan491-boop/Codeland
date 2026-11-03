'use client';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Menu,
  ShieldCheck,
  ArrowUpRight,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { AccountAccess } from '@/features/account/components/account-access';
import {
  useDemoAccount,
  signOutDemoAccount,
} from '@/features/account/lib/demo-auth';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  adminContext,
  adminSnapshot,
  subscribeAdmin,
  activateAdminDemo,
  switchAdminActor,
  clearAdminActor,
} from '../lib/store';
import { acceptAdminInvitation } from '../lib/content';
import { addAdminExamples } from '../lib/demo';
import { adminAdapter } from '../lib/adapter';
import { ADMIN_NAV, ADMIN_ROLES, adminPath } from '../lib/config';
import type { AdminContext, AdminSection } from '../lib/types';
import { PartnerVerification, CatalogModeration } from './verification-panels';
import { PaymentsPanel, SettlementsPanel } from './money-panels';
import {
  ReservationsPanel,
  VenueAdminPanel,
  CustomersAdminPanel,
  SupportAdminPanel,
} from './operations-panels';
import {
  CmsPanel,
  SettingsPanel,
  ModerationPanel,
  ReportsPanel,
} from './content-panels';
import { AccessPanel, IntegrationsPanel } from './access-integrations';
import { AdminOverview } from './overview';
import {
  useAdminResource,
  ResourceState,
  useAdminAction,
  AdminFeedback,
  FormError,
  errorMessage,
  FormField,
  field,
} from './shared';
function allowed(ctx: AdminContext, section: AdminSection) {
  const n = ADMIN_NAV.find((v) => v.id === section)!;
  return (
    ctx.capabilities.includes(n.cap) ||
    (section === 'payments' &&
      (ctx.capabilities.includes('refund_approve') ||
        ctx.capabilities.includes('reconcile'))) ||
    (section === 'settlements' &&
      (ctx.capabilities.includes('payout_approve') ||
        ctx.capabilities.includes('payout_record') ||
        ctx.capabilities.includes('reconcile')))
  );
}
export function AdminDashboard({ section }: { section: AdminSection }) {
  const account = useDemoAccount(),
    snapshot = useSyncExternalStore(subscribeAdmin, adminSnapshot, () => ''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((v) => v + 1);
    for (const event of [
      'focus',
      'gobuking:partner-changed',
      'gobuking:inventory-changed',
      'gobuking:car-inventory-changed',
      'gobuking:inquiry-changed',
      'gobuking:dashboard-changed',
    ])
      window.addEventListener(event, refresh);
    return () => {
      for (const event of [
        'focus',
        'gobuking:partner-changed',
        'gobuking:inventory-changed',
        'gobuking:car-inventory-changed',
        'gobuking:inquiry-changed',
        'gobuking:dashboard-changed',
      ])
        window.removeEventListener(event, refresh);
    };
  }, []);
  const state = useMemo(() => {
    void snapshot;
    if (!account) return { ctx: null, error: '' };
    try {
      return { ctx: adminContext(), error: '' };
    } catch (e) {
      return {
        ctx: null,
        error:
          e instanceof Error && 'code' in e && e.code === 'BOOTSTRAP'
            ? ''
            : errorMessage(e),
      };
    }
  }, [account, snapshot]);
  return (
    <main id="main" className="ptr-module adm-module">
      {!account ? (
        <div className="ptr-gate">
          <AccountAccess purpose="admin" />
        </div>
      ) : !state.ctx ? (
        <AdminActivation error={state.error} />
      ) : (
        <AdminShell
          key={`${state.ctx.key}:${section}`}
          ctx={state.ctx}
          section={section}
          revision={`${snapshot}:${revision}`}
        />
      )}
    </main>
  );
}
function AdminActivation({ error }: { error: string }) {
  const { t } = useI18n(),
    a = useAdminAction(() => {});
  return (
    <div className="ptr-onboarding">
      <span className="ptr-icon">
        <ShieldCheck />
      </span>
      <h1>{t('Pusat kendali Gobuking.')}</h1>
      <p>
        {t(
          'Akses platform dibatasi berdasarkan peran. Aktifkan workspace contoh untuk meninjau alur admin lokal.',
        )}
      </p>
      <FormError message={error} />
      {!error && (
        <section className="ptr-card">
          <h2>{t('Workspace Super Admin demo')}</h2>
          <p>
            {t(
              'Tersedia persona Content, Operations/CS, Finance Maker, Checker, dan Super Admin. Tidak ada transaksi keuangan nyata.',
            )}
          </p>
          <button
            className="ptr-button"
            disabled={a.busy}
            onClick={() =>
              a.run(activateAdminDemo, 'Workspace admin demo siap.')
            }
          >
            {t('Aktifkan workspace admin demo')}
          </button>
        </section>
      )}
      <details className="ptr-card">
        <summary>{t('Aktifkan undangan platform')}</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(
              () => acceptAdminInvitation(field(f, 'code')),
              'Undangan admin diaktifkan.',
            );
          }}
        >
          <FormField label="Kode OTP undangan">
            <input name="code" inputMode="numeric" maxLength={6} required />
          </FormField>
          <p>{t('Gunakan akun dengan email undangan. OTP demo: 123456.')}</p>
          <button className="ptr-button" disabled={a.busy}>
            {t('Verifikasi undangan admin')}
          </button>
        </form>
      </details>
      <button className="ptr-text-button" onClick={clearAdminActor}>
        {t('Muat ulang akses admin')}
      </button>
      <AdminFeedback {...a} />
    </div>
  );
}
function AdminShell({
  ctx,
  section,
  revision,
}: {
  ctx: AdminContext;
  section: AdminSection;
  revision: string;
}) {
  const { t, locale, changeLocale } = useI18n(),
    [menu, setMenu] = useState(false),
    [local, setLocal] = useState(0),
    a = useAdminAction(() => setLocal((v) => v + 1)),
    r = useAdminResource(
      () =>
        adminAdapter.workspace(
          new URLSearchParams(window.location.search).get('scenario') ??
            'ready',
        ),
      `${ctx.key}:${section}:${revision}:${local}`,
    ),
    nav = ADMIN_NAV.find((v) => v.id === section)!,
    links = (
      <nav aria-label={t('Navigasi admin')}>
        {ADMIN_NAV.filter((v) => allowed(ctx, v.id)).map((v) => (
          <Link
            key={v.id}
            href={adminPath(v.id)}
            className={v.id === section ? 'active' : ''}
            aria-current={v.id === section ? 'page' : undefined}
            onClick={() => setMenu(false)}
          >
            <v.icon size={18} />
            {t(v.label)}
          </Link>
        ))}
      </nav>
    );
  return (
    <div className="ptr-app adm-app">
      <aside className="ptr-sidebar">
        <Link href="/admin" className="ptr-brand">
          <ShieldCheck size={25} />
          <span>
            gobuking <small>ADMIN CONTROL</small>
          </span>
        </Link>
        <div className="ptr-org-mark">
          <span>{ctx.actor.name.charAt(0)}</span>
          <div>
            <strong>{ctx.actor.name}</strong>
            <small>{ADMIN_ROLES[ctx.actor.role]}</small>
          </div>
        </div>
        {links}
        <div className="ptr-sidebar-bottom">
          <Link href="/partner">
            {t('Ruang mitra')}
            <ArrowUpRight size={15} />
          </Link>
          <Link href="/">
            {t('Buka situs pelanggan')}
            <ArrowUpRight size={15} />
          </Link>
          <button onClick={signOutDemoAccount}>
            <LogOut size={15} />
            {t('Keluar')}
          </button>
          <small>{t('Platform demo lokal')}</small>
        </div>
      </aside>
      <div className="ptr-workspace">
        <div className="ptr-topbar">
          <div className="ptr-mobile">
            <Dialog open={menu} onOpenChange={setMenu}>
              <DialogTrigger asChild>
                <button
                  className="ptr-icon-button"
                  aria-label={t('Menu admin')}
                >
                  <Menu size={20} />
                </button>
              </DialogTrigger>
              <DialogContent className="ptr-module ptr-inline">
                <DialogTitle>{t('Menu admin')}</DialogTitle>
                <DialogDescription>
                  {ADMIN_ROLES[ctx.actor.role]}
                </DialogDescription>
                <div className="ptr-drawer-nav">{links}</div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="ptr-context">
            <label htmlFor="admin-persona">
              {t('Aktor platform / persona demo')}
            </label>
            <select
              id="admin-persona"
              value={ctx.actor.id}
              onChange={(e) => switchAdminActor(e.target.value)}
            >
              {ctx.actors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {ADMIN_ROLES[v.role]}
                </option>
              ))}
            </select>
          </div>
          <span className="adm-top-label">
            <ShieldCheck size={14} />
            {t('Akses terkontrol')}
          </span>
          <div className="ptr-language">
            <label className="ptr-locale-label" htmlFor="admin-locale">
              {t('Bahasa')}
            </label>
            <select
              id="admin-locale"
              value={locale}
              onChange={(e) => changeLocale(e.target.value as 'id' | 'en')}
            >
              <option value="id">ID</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
        <div className="ptr-page">
          <div className="ptr-page-heading">
            <div>
              <span className="ptr-eyebrow">
                {t('ADMIN CONTROL')} / {ADMIN_ROLES[ctx.actor.role]}
              </span>
              <h1>{t(nav.label)}</h1>
              <p>{t('Keputusan tertelusur. Kewenangan terpisah.')}</p>
            </div>
            <button
              className="ptr-button secondary"
              disabled={r.loading}
              onClick={r.reload}
            >
              <RefreshCw size={16} />
              {t('Periksa status')}
            </button>
          </div>
          {r.data?.emergency && (
            <div className="ptr-warning">
              {t('Akses darurat aktif sampai')}:{' '}
              {new Date(r.data.emergency.expiresAt).toLocaleTimeString()} ·{' '}
              {t('Pemisahan Maker/Checker tetap wajib.')}
            </div>
          )}
          {!allowed(ctx, section) ? (
            <FormError message="Peran admin ini tidak memiliki izin untuk halaman tersebut." />
          ) : (
            <>
              <ResourceState
                loading={r.loading && !r.data}
                error={r.error}
                retry={r.reload}
              />
              {r.data && (
                <div aria-busy={r.loading}>
                  {section === 'overview' ? (
                    <AdminOverview data={r.data} />
                  ) : section === 'partners' ? (
                    <PartnerVerification data={r.data} reload={r.reload} />
                  ) : section === 'catalog' ? (
                    <CatalogModeration data={r.data} reload={r.reload} />
                  ) : section === 'reservations' ? (
                    <ReservationsPanel data={r.data} reload={r.reload} />
                  ) : section === 'venue-crm' ? (
                    <VenueAdminPanel data={r.data} reload={r.reload} />
                  ) : section === 'customers' ? (
                    <CustomersAdminPanel data={r.data} reload={r.reload} />
                  ) : section === 'payments' ? (
                    <PaymentsPanel data={r.data} reload={r.reload} />
                  ) : section === 'settlements' ? (
                    <SettlementsPanel data={r.data} reload={r.reload} />
                  ) : section === 'support' ? (
                    <SupportAdminPanel data={r.data} reload={r.reload} />
                  ) : section === 'cms' ? (
                    <CmsPanel data={r.data} reload={r.reload} />
                  ) : section === 'reports' ? (
                    <ReportsPanel />
                  ) : section === 'settings' ? (
                    <SettingsPanel data={r.data} reload={r.reload} />
                  ) : section === 'moderation' ? (
                    <ModerationPanel data={r.data} reload={r.reload} />
                  ) : section === 'integrations' ? (
                    <IntegrationsPanel data={r.data} reload={r.reload} />
                  ) : (
                    <AccessPanel data={r.data} reload={r.reload} />
                  )}
                </div>
              )}
            </>
          )}
          {ctx.capabilities.includes('access') && (
            <details className="ptr-demo">
              <summary>{t('Simulasi antrean platform')}</summary>
              <p>
                {t(
                  'Tambahkan pengajuan mitra, duplikasi villa, reservasi exception, dan ulasan untuk meninjau kontrol admin. Semua aktivitas bersifat lokal.',
                )}
              </p>
              <button
                className="ptr-button secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(addAdminExamples, 'Antrean admin contoh siap ditinjau.')
                }
              >
                {t('Tambahkan antrean admin contoh')}
              </button>
              <AdminFeedback {...a} />
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
