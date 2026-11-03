'use client';
import Link from 'next/link';
import { AccountAccess } from '@/features/account/components/account-access';
import { useDemoAccount } from '@/features/account/lib/demo-auth';
import { useState } from 'react';
import {
  Compass,
  ChevronDown,
  CircleHelp,
  Menu,
  ArrowUpRight,
  X,
  UserRound,
} from 'lucide-react';
import { SERVICES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useI18n } from '@/components/i18n/locale-provider';
export function Logo({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-2 text-[25px] font-extrabold tracking-[-1.2px] ${light ? 'text-white' : 'text-primary'}`}
      aria-label={t('Gobuking beranda')}
    >
      <span
        className={`flex size-8 items-center justify-center rounded-[10px] ${light ? 'bg-white/15' : 'bg-primary text-white'}`}
      >
        <Compass size={23} strokeWidth={2} />
      </span>
      gobuking
      <span className={`-ml-1 ${light ? 'text-blue-300' : 'text-blue-600'}`}>
        .
      </span>
    </Link>
  );
}
export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const account = useDemoAccount();
  return (
    <>
      <div className="demo-bar">
        {t('Anda sedang menjelajahi demo lokal · Phase 01–10')}
        <span>·</span>
        {t('Tidak ada transaksi nyata')}
      </div>
      <header className="site-header">
        <div className="page-container flex min-h-[84px] items-center justify-between gap-4">
          <Logo light />
          <nav
            aria-label={t('Navigasi utama')}
            className="hidden items-center gap-6 text-sm font-medium xl:flex"
          >
            <Link href="/#search" className="nav-link">
              {t('Jelajahi')}
              <ChevronDown size={14} />
            </Link>
            <Link href="/offers" className="nav-link">
              {t('Penawaran')}
              <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-800">
                DEMO
              </span>
            </Link>
            <Link href="/partner" className="nav-link">
              {t('Jadi mitra')}
              <ArrowUpRight size={14} />
            </Link>
          </nav>
          <div className="header-actions flex items-center gap-3">
            <LanguageSelector />
            <span className="hidden text-xs text-blue-100 xl:block">IDR</span>
            <Link
              href="/info/help"
              className="hidden size-12 items-center justify-center rounded-xl text-blue-100 hover:bg-white/10 sm:flex"
              aria-label={t('Pusat bantuan')}
            >
              <CircleHelp size={19} />
            </Link>
            <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
              <DialogTrigger asChild>
                <Button
                  className="hidden px-3 sm:inline-flex sm:px-5"
                  aria-label={t(account ? 'Akun saya' : 'Masuk / Daftar')}
                >
                  <UserRound />
                  <span>{t(account ? 'Akun saya' : 'Masuk / Daftar')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto">
                <DialogTitle className="sr-only">
                  {t('Akun Anda, perjalanan Anda.')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t(
                    'Masuk atau daftar, lalu isi data tamu dan pilih metode pembayaran.',
                  )}
                </DialogDescription>
                <AccountAccess onComplete={() => setAccountOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button
              className="text-white hover:bg-white/10 xl:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={t(open ? 'Tutup menu' : 'Buka menu')}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label={t('Navigasi mobile')}
            className="border-t border-border bg-white px-5 pb-5 text-slate-900"
          >
            <button
              type="button"
              className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl bg-blue-50 px-3 text-sm font-semibold text-primary sm:hidden"
              onClick={() => {
                setOpen(false);
                setAccountOpen(true);
              }}
            >
              <UserRound size={18} />
              {t(account ? 'Akun saya' : 'Masuk / Daftar')}
            </button>
            <div className="grid grid-cols-2 gap-2 py-3">
              {SERVICES.map((s) => (
                <Link
                  key={s.id}
                  href={`/?service=${s.id}#search`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-lg p-3 text-sm hover:bg-muted"
                >
                  <s.icon size={18} />
                  {t(s.label)}
                </Link>
              ))}
            </div>
            {[
              ['/offers', 'Penawaran'],
              ['/info/partner', 'Jadi mitra'],
              ['/info/help', 'Pusat bantuan'],
            ].map(([href, label]) => (
              <Link
                href={href}
                key={href}
                onClick={() => setOpen(false)}
                className="block rounded-lg p-3 text-sm hover:bg-muted"
              >
                {t(label)}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
