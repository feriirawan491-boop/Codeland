'use client';
import { useEffect, useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  ArrowUpRight,
  Building2,
  LogOut,
  ShieldCheck,
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
import { createPartnerOrganization } from '../lib/business';
import { addPartnerDemoActivities, simulatePartnerRefund } from '../lib/demo';
import { acceptPartnerInvitation } from '../lib/management';
import {
  PARTNER_NAV,
  PARTNER_ROLES,
  BUSINESS_STATUS,
  partnerPath,
} from '../lib/config';
import {
  getPartnerContext,
  partnerSnapshot,
  subscribePartner,
  PARTNER_EVENT,
  switchPartnerMembership,
  clearPartnerSelection,
} from '../lib/store';
import { partnerAdapter } from '../lib/adapter';
import type { PartnerSection, PartnerContext, Capability } from '../lib/types';
import { PartnerOverview } from './overview';
import { BusinessPanel } from './business-panel';
import { ListingPanel } from './listing-panel';
import { InventoryPanel } from './inventory-panel';
import { ReservationPanel } from './reservation-panel';
import { CrmPanel } from './crm-panel';
import { CustomerPanel, ReviewPanel } from './customer-review-panel';
import { FinancePanel } from './finance-panel';
import { TeamPanel, SupportPanel } from './team-support-panel';
import {
  usePartnerResource,
  ResourceState,
  usePartnerAction,
  Feedback,
  FormField,
  field,
  FormError,
  errorMessage,
} from './shared';
const REQUIRED: Record<PartnerSection, Capability> = {
  overview: 'read',
  business: 'read',
  listings: 'read',
  inventory: 'inventory',
  reservations: 'reservation',
  operations: 'operation',
  inquiries: 'crm',
  customers: 'customer',
  reviews: 'review',
  finance: 'finance',
  team: 'team',
  support: 'support',
};
function safeContext() {
  try {
    return { data: getPartnerContext(), error: '' };
  } catch (e) {
    return {
      data: null,
      error:
        e instanceof Error && 'code' in e && e.code === 'ONBOARDING'
          ? ''
          : errorMessage(e),
    };
  }
}
export function PartnerDashboard({ section }: { section: PartnerSection }) {
  const account = useDemoAccount(),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((v) => v + 1);
    window.addEventListener(PARTNER_EVENT, refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(PARTNER_EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  const snapshot = useSyncExternalStore(
    subscribePartner,
    partnerSnapshot,
    () => '',
  );
  const state = useMemo(() => {
    void snapshot;
    return account ? safeContext() : { data: null, error: '' };
  }, [account, snapshot]);
  const ctx = state.data;
  return (
    <main id="main" className="ptr-module">
      {!account ? (
        <div className="ptr-gate">
          <AccountAccess purpose="partner" />
        </div>
      ) : !ctx ? (
        <PartnerOnboarding
          reload={() => setRevision((v) => v + 1)}
          key={account.id}
          issue={state.error}
        />
      ) : (
        <PartnerShell
          key={`${ctx.accountId}:${ctx.sessionKey}:${section}`}
          ctx={ctx}
          section={section}
          revision={revision}
        />
      )}
    </main>
  );
}
function PartnerOnboarding({
  reload,
  issue,
}: {
  reload: () => void;
  issue: string;
}) {
  const { t } = useI18n(),
    a = usePartnerAction(reload);
  return (
    <div className="ptr-onboarding">
      <FormError message={issue} />
      <span className="ptr-icon">
        <Building2 />
      </span>
      <h1>{t('Ruang untuk tumbuh bersama.')}</h1>
      <p>
        {t('Kelola usaha, layanan, dan tim Anda melalui ruang mitra Gobuking.')}
      </p>
      <section className="ptr-card">
        <h2>{t('Daftarkan organisasi')}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(
              () =>
                createPartnerOrganization({
                  name: field(f, 'name'),
                  email: field(f, 'email'),
                  phone: field(f, 'phone'),
                  address: field(f, 'address'),
                }),
              'Organisasi draft dibuat. Lengkapi dokumen untuk verifikasi.',
            );
          }}
        >
          <FormField label="Nama usaha">
            <input name="name" required minLength={3} />
          </FormField>
          <FormField label="Email usaha">
            <input name="email" type="email" required />
          </FormField>
          <FormField label="Telepon usaha">
            <input name="phone" type="tel" required />
          </FormField>
          <FormField label="Alamat usaha">
            <textarea name="address" required minLength={10} />
          </FormField>
          <button className="ptr-button" disabled={a.busy}>
            {t('Buat organisasi')}
          </button>
        </form>
      </section>
      <details className="ptr-card">
        <summary>{t('Jelajahi workspace contoh')}</summary>
        <p>
          {t(
            'Aktifkan dua organisasi demo beserta persona Owner, Operations, dan Finance. Data tersimpan pada tab ini.',
          )}
        </p>
        <button
          className="ptr-button secondary"
          disabled={a.busy}
          onClick={() =>
            a.run(
              () =>
                createPartnerOrganization(
                  {
                    name: 'Nusa Hospitality',
                    email: 'partner@example.test',
                    phone: '081234567890',
                    address: 'Alamat usaha contoh Gobuking, Indonesia',
                  },
                  true,
                ),
              'Workspace mitra demo siap.',
            )
          }
        >
          {t('Aktifkan workspace mitra demo')}
        </button>
      </details>
      <details className="ptr-card">
        <summary>{t('Punya undangan staf?')}</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await a.run(() =>
              acceptPartnerInvitation(field(f, 'invite'), field(f, 'code')),
            );
          }}
        >
          <FormField label="ID undangan">
            <input name="invite" required />
          </FormField>
          <FormField label="Kode verifikasi demo">
            <input name="code" required inputMode="numeric" maxLength={6} />
          </FormField>
          <p>{t('Gunakan akun dengan email undangan. OTP demo: 123456.')}</p>
          <button className="ptr-button" disabled={a.busy}>
            {t('Aktifkan undangan')}
          </button>
        </form>
      </details>
      <button
        className="ptr-text-button"
        onClick={() => {
          clearPartnerSelection();
          reload();
        }}
      >
        {t('Muat ulang akses organisasi')}
      </button>
      <Feedback {...a} />
    </div>
  );
}
function PartnerShell({
  ctx,
  section,
  revision,
}: {
  ctx: PartnerContext;
  section: PartnerSection;
  revision: number;
}) {
  const { t, locale, changeLocale } = useI18n(),
    [menu, setMenu] = useState(false),
    [localRevision, setLocalRevision] = useState(0),
    a = usePartnerAction(() => setLocalRevision((v) => v + 1)),
    nav = PARTNER_NAV.find((v) => v.id === section)!,
    allowed = ctx.capabilities.includes(REQUIRED[section]),
    r = usePartnerResource(
      () =>
        partnerAdapter.getWorkspace(
          new URLSearchParams(window.location.search).get('scenario') ??
            'ready',
        ),
      `${ctx.sessionKey}:${section}:${revision}:${localRevision}`,
    );
  const links = (
    <nav aria-label={t('Navigasi mitra')}>
      {PARTNER_NAV.filter((v) => ctx.capabilities.includes(REQUIRED[v.id])).map(
        (v) => (
          <Link
            href={partnerPath(v.id)}
            key={v.id}
            className={section === v.id ? 'active' : ''}
            aria-current={section === v.id ? 'page' : undefined}
            onClick={() => setMenu(false)}
          >
            <v.icon size={18} />
            {t(v.label)}
          </Link>
        ),
      )}
    </nav>
  );
  return (
    <div className="ptr-app">
      <aside className="ptr-sidebar">
        <Link href="/partner" className="ptr-brand">
          <Building2 size={23} />
          <span>
            gobuking <small>PARTNER</small>
          </span>
        </Link>
        <div className="ptr-org-mark">
          <span>{ctx.organization.name.charAt(0)}</span>
          <div>
            <strong>{ctx.organization.name}</strong>
            <small>{PARTNER_ROLES[ctx.membership.role]}</small>
          </div>
        </div>
        {links}
        <div className="ptr-sidebar-bottom">
          <Link href="/">
            {t('Buka situs pelanggan')}
            <ArrowUpRight size={15} />
          </Link>
          <button onClick={signOutDemoAccount}>
            <LogOut size={16} />
            {t('Keluar')}
          </button>
          <small>
            <ShieldCheck size={13} />
            {t('Workspace demo lokal')}
          </small>
        </div>
      </aside>
      <div className="ptr-workspace">
        <div className="ptr-topbar">
          <div className="ptr-mobile">
            <Dialog open={menu} onOpenChange={setMenu}>
              <DialogTrigger asChild>
                <button
                  className="ptr-icon-button"
                  aria-label={t('Menu mitra')}
                >
                  <Menu size={21} />
                </button>
              </DialogTrigger>
              <DialogContent className="ptr-module ptr-inline">
                <DialogTitle>{t('Menu mitra')}</DialogTitle>
                <DialogDescription>{ctx.organization.name}</DialogDescription>
                <div className="ptr-drawer-nav">{links}</div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="ptr-context">
            <label htmlFor="partner-org">
              {t('Organisasi / persona demo')}
            </label>
            <select
              id="partner-org"
              value={ctx.membership.id}
              onChange={(e) => switchPartnerMembership(e.target.value)}
            >
              {ctx.memberships.map((m) => (
                <option key={m.id} value={m.id}>
                  {ctx.organizations.find((o) => o.id === m.orgId)?.name} ·{' '}
                  {m.name} · {PARTNER_ROLES[m.role]}
                </option>
              ))}
            </select>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="ptr-icon-button"
                aria-label={t('Notifikasi mitra')}
              >
                <Bell size={18} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{t('Notifikasi mitra')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Tindak lanjut berdasarkan aktivitas organisasi dan assignment Anda.',
                )}
              </DialogDescription>
              <div className="ptr-module ptr-inline">
                {r.data?.notifications.length ? (
                  r.data.notifications.map((v) => (
                    <Link className="ptr-queue" key={v.id} href={v.href}>
                      <div>
                        <strong>{t(v.label)}</strong>
                        <small>{v.id}</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))
                ) : (
                  <p>{t('Belum ada notifikasi yang perlu ditindaklanjuti.')}</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <div className="ptr-language">
            <label className="ptr-locale-label" htmlFor="partner-language">
              {t('Bahasa')}
            </label>
            <select
              id="partner-language"
              aria-label={t('Bahasa')}
              value={locale}
              onChange={(e) => changeLocale(e.target.value as 'id' | 'en')}
            >
              <option value="id">ID</option>
              <option value="en">EN</option>
            </select>
          </div>
          <span className="ptr-top-status">
            {t(BUSINESS_STATUS[ctx.organization.status])}
          </span>
        </div>
        <div className="ptr-page">
          <div className="ptr-page-heading">
            <div>
              <span className="ptr-eyebrow">
                {t('PARTNER WORKSPACE')} / {ctx.organization.name}
              </span>
              <h1>{t(nav.label)}</h1>
              <p>{t('Kelola setiap detail. Siapkan pengalaman terbaik.')}</p>
            </div>
            <button
              className="ptr-button secondary"
              disabled={r.loading}
              onClick={r.reload}
            >
              {t('Periksa status')}
            </button>
            <span className="ptr-icon">
              <nav.icon size={25} />
            </span>
          </div>
          {!allowed ? (
            <FormError message="Peran ini tidak memiliki izin untuk halaman tersebut." />
          ) : (
            <>
              <ResourceState
                loading={r.loading && !r.data}
                error={r.error}
                retry={r.reload}
              />
              {r.data && (
                <div key={`${ctx.sessionKey}:${section}`} aria-busy={r.loading}>
                  {section === 'overview' ? (
                    <PartnerOverview data={r.data} />
                  ) : section === 'business' ? (
                    <BusinessPanel ctx={ctx} reload={r.reload} />
                  ) : section === 'listings' ? (
                    <ListingPanel
                      listings={r.data.listings}
                      ctx={ctx}
                      reload={r.reload}
                    />
                  ) : section === 'inventory' ? (
                    <InventoryPanel
                      listings={r.data.listings}
                      reload={r.reload}
                    />
                  ) : section === 'reservations' || section === 'operations' ? (
                    <ReservationPanel
                      rows={r.data.reservations}
                      services={r.data.services}
                      operations={section === 'operations'}
                      reload={r.reload}
                    />
                  ) : section === 'inquiries' ? (
                    <CrmPanel data={r.data} reload={r.reload} />
                  ) : section === 'customers' ? (
                    <CustomerPanel />
                  ) : section === 'reviews' ? (
                    <ReviewPanel />
                  ) : section === 'finance' ? (
                    <FinancePanel ctx={ctx} />
                  ) : section === 'team' ? (
                    <TeamPanel
                      members={r.data.team}
                      listings={r.data.listings}
                      reload={r.reload}
                    />
                  ) : (
                    <SupportPanel
                      listings={r.data.listings}
                      activities={r.data.activities}
                    />
                  )}
                </div>
              )}
            </>
          )}
          {ctx.membership.role === 'owner' && (
            <details className="ptr-demo">
              <summary>{t('Simulasi aktivitas usaha')}</summary>
              <p>
                {t(
                  'Tambahkan pesanan dan inquiry contoh melalui sumber transaksi yang sama dengan dashboard pelanggan. Tidak ada transaksi nyata.',
                )}
              </p>
              <div className="ptr-actions">
                <button
                  className="ptr-button secondary"
                  disabled={a.busy}
                  onClick={() =>
                    a.run(
                      addPartnerDemoActivities,
                      'Aktivitas contoh siap ditinjau.',
                    )
                  }
                >
                  {t('Tambahkan aktivitas mitra contoh')}
                </button>
                <button
                  className="ptr-button secondary"
                  disabled={a.busy}
                  onClick={() =>
                    a.run(
                      simulatePartnerRefund,
                      'Refund contoh dicatat pada sumber transaksi.',
                    )
                  }
                >
                  {t('Simulasikan refund setelah payout')}
                </button>
              </div>
              <Feedback {...a} />
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
