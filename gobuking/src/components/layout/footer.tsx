import Link from 'next/link';
import { Compass, ArrowUpRight, Heart, Globe2 } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
export async function Footer() {
  const { t } = await getI18n();
  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="grid gap-10 pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white"
            >
              <Compass size={28} />
              gobuking<span className="-ml-1 text-orange-300">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
              {t('Lebih dekat dengan tempat baru,')}
              <br />
              {t('lebih banyak cerita untuk dibawa pulang.')}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300">
              <Globe2 size={14} />
              {t('Indonesia')}
              <span className="mx-1 text-slate-400">|</span>
              {t('IDR · Rupiah')}
            </div>
          </div>
          <div>
            <h2 className="footer-heading">{t('Jelajahi')}</h2>
            {[
              ['hotel', 'Hotel'],
              ['home', 'Home Rental'],
              ['flight', 'Penerbangan'],
              ['car', 'Rental Mobil'],
            ].map(([s, l]) => (
              <Link
                className="footer-link"
                key={s}
                href={`/?service=${s}#search`}
              >
                {t(l)}
              </Link>
            ))}
          </div>
          <div>
            <h2 className="footer-heading">{t('Momen spesial')}</h2>
            <Link className="footer-link" href="/?service=mice#search">
              {t('MICE & pertemuan')}
            </Link>
            <Link className="footer-link" href="/?service=wedding#search">
              {t('Wedding venue')}
            </Link>
            <Link className="footer-link" href="/offers">
              {t('Penawaran')}
            </Link>
            <Link className="footer-link" href="/partner">
              {t('Jadi mitra')}
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div>
            <h2 className="footer-heading">{t('Tentang Gobuking')}</h2>
            <Link className="footer-link" href="/account/bookings">
              {t('Dashboard akun')}
            </Link>
            {[
              ['about', 'Tentang kami'],
              ['help', 'Pusat bantuan'],
              ['terms', 'Syarat & ketentuan'],
              ['privacy', 'Privasi'],
            ].map(([s, l]) => (
              <Link className="footer-link" key={s} href={`/info/${s}`}>
                {t(l)}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-white/15 pt-6 text-[11px] text-slate-300">
          <p>
            © {new Date().getFullYear()}{' '}
            {t('Gobuking. Demo lokal · Phase 01–10.')}
          </p>
          <p className="flex items-center gap-1.5">
            {t('Dibuat untuk cerita baru')}
            <Heart size={12} />
            <span className="mx-2">·</span>
            {t('Foto ilustrasi dari')}{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
