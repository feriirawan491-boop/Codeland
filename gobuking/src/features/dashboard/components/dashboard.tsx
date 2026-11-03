'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowUpRight, LogOut, ShieldCheck, Compass } from 'lucide-react';
import {
  useDemoAccount,
  signOutDemoAccount,
  currentDemoSessionId,
} from '@/features/account/lib/demo-auth';
import { AccountAccess } from '@/features/account/components/account-access';
import { useI18n } from '@/components/i18n/locale-provider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DASHBOARD_NAV } from '../lib/config';
import { createDashboardDemo } from '../lib/demo';
import type { DashboardSection } from '../lib/types';
import { BookingList } from './booking-list';
import { ProfilePanel } from './profile-panel';
import { InquiryPanel, SavedPanel } from './property-panels';
import { ReviewsPanel } from './reviews-panel';
import { SecurityPanel } from './security-panel';
import { SupportPanel } from './support-panel';
import { errorMessage, FormError } from './shared';
const descriptions: Record<DashboardSection, string> = {
  bookings: 'Semua rencana mendatang, dalam satu tempat.',
  history: 'Lihat kembali perjalanan dan transaksi Anda.',
  inquiries: 'Pantau kebutuhan acara dan versi penawaran terbaru.',
  saved: 'Simpan inspirasi untuk perjalanan berikutnya.',
  profile: 'Lengkapi profil untuk pengalaman yang lebih personal.',
  refunds: 'Tinjau kebijakan, pembatalan, dan perkembangan refund.',
  reviews: 'Pengalaman Anda membantu perjalanan berikutnya.',
  security: 'Anda yang mengendalikan akses akun dan data pribadi.',
  support: 'Kami membantu Anda menuntaskan setiap pertanyaan.',
};
export function UserDashboard({
  section,
  ticketId,
}: {
  section: DashboardSection;
  ticketId?: string;
}) {
  const account = useDemoAccount();
  return (
    <main id="main" className="usr-module">
      {account ? (
        <DashboardContent
          key={`${account.id}:${currentDemoSessionId()}`}
          section={section}
          ticketId={ticketId}
          account={account}
        />
      ) : (
        <div className="usr-gate">
          <AccountAccess purpose="dashboard" />
        </div>
      )}
    </main>
  );
}
function DashboardContent({
  section,
  ticketId,
  account,
}: {
  section: DashboardSection;
  ticketId?: string;
  account: NonNullable<ReturnType<typeof useDemoAccount>>;
}) {
  const { t } = useI18n(),
    [menu, setMenu] = useState(false),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    nav = DASHBOARD_NAV.find((v) => v.id === section)!;
  const links = (
    <nav aria-label={t('Navigasi akun')}>
      {DASHBOARD_NAV.map((item) => (
        <Link
          key={item.id}
          href={item.path}
          className={section === item.id ? 'active' : ''}
          aria-current={section === item.id ? 'page' : undefined}
          onClick={() => setMenu(false)}
        >
          <item.icon size={19} />
          {t(item.label)}
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <div className="usr-banner">
        <div className="usr-container">
          <span className="usr-eyebrow">
            <Compass size={15} /> {t('RUANG PERJALANAN ANDA')}
          </span>
          <h1>{t('Halo, {name}.', { name: account.name.split(' ')[0] })}</h1>
          <p>{t('Rencana berikutnya dimulai dari sini.')}</p>
          <Link href="/">
            {t('Temukan perjalanan baru')}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="usr-container usr-layout">
        <aside className="usr-sidebar">
          <div className="usr-person">
            <span>{account.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{account.name}</strong>
              <small>{account.email}</small>
            </div>
          </div>
          {links}
          <button className="usr-logout" onClick={signOutDemoAccount}>
            <LogOut size={18} />
            {t('Keluar')}
          </button>
          <p className="usr-secure">
            <ShieldCheck size={16} />
            {t('Akun demo lokal')}
          </p>
        </aside>
        <div className="usr-content">
          <div className="usr-mobile-nav">
            <Dialog open={menu} onOpenChange={setMenu}>
              <DialogTrigger asChild>
                <button className="usr-button secondary">
                  <Menu size={18} />
                  {t('Menu akun')}
                </button>
              </DialogTrigger>
              <DialogContent className="usr-module usr-inline">
                <DialogTitle>{t('Menu akun')}</DialogTitle>
                <DialogDescription>
                  {t('Pilih halaman akun Anda.')}
                </DialogDescription>
                <div className="usr-menu-links">{links}</div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="usr-section-heading">
            <span className="usr-icon">
              <nav.icon size={22} />
            </span>
            <div>
              <h2>{t(nav.label)}</h2>
              <p>{t(descriptions[section])}</p>
            </div>
          </div>
          <div key={revision}>
            {['bookings', 'history', 'refunds'].includes(section) ? (
              <BookingList
                section={section as 'bookings' | 'history' | 'refunds'}
              />
            ) : section === 'profile' ? (
              <ProfilePanel />
            ) : section === 'inquiries' ? (
              <InquiryPanel />
            ) : section === 'saved' ? (
              <SavedPanel />
            ) : section === 'reviews' ? (
              <ReviewsPanel />
            ) : section === 'security' ? (
              <SecurityPanel />
            ) : (
              <SupportPanel ticketId={ticketId} />
            )}
          </div>
          <details className="usr-demo">
            <summary>{t('Coba aktivitas dashboard demo')}</summary>
            <p>
              {t(
                'Tambahkan contoh pesanan aktif, riwayat, inquiry, dan layanan selesai ke akun ini. Tidak ada pembayaran atau email sungguhan.',
              )}
            </p>
            <button
              className="usr-button secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await createDashboardDemo();
                  setRevision((v) => v + 1);
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t(busy ? 'Menyiapkan contoh…' : 'Tambahkan aktivitas contoh')}
            </button>
            <FormError message={error} />
          </details>
        </div>
      </div>
    </>
  );
}
