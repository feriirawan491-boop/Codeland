import Link from 'next/link';
import {
  Compass,
  ListChecks,
  MessagesSquare,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getI18n } from '@/lib/i18n/server';
export async function TrustSection() {
  const { t } = await getI18n();
  return (
    <>
      <section className="page-container section-space">
        <div className="why-section">
          <div>
            <p className="eyebrow">{t('SATU TEMPAT, BANYAK KEMUNGKINAN')}</p>
            <h2>
              {t('Lebih mudah merencanakan.')}
              <br />
              {t('Lebih leluasa menikmati.')}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {t('Dari memilih tujuan sampai merayakan momen.')}
              <br className="hidden sm:block" />
              {t('Awali semua rencana Anda bersama Gobuking.')}
            </p>
          </div>
          <div className="grid gap-7 sm:grid-cols-3 lg:gap-6">
            {[
              {
                icon: Compass,
                title: 'Pilihan untuk setiap rencana',
                text: 'Enam kategori layanan, dari perjalanan hingga momen istimewa.',
              },
              {
                icon: ListChecks,
                title: 'Informasi yang jelas',
                text: 'Kenali rincian, ketentuan, dan langkah berikutnya sebelum memutuskan.',
              },
              {
                icon: MessagesSquare,
                title: 'Bantuan mudah ditemukan',
                text: 'Panduan dan pusat bantuan yang selalu dapat Anda akses.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary">
                  <item.icon size={21} />
                </div>
                <h3 className="text-sm font-semibold leading-6">
                  {t(item.title)}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {t(item.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container mb-16">
        <div className="partner-banner">
          <div>
            <p className="text-xs font-semibold tracking-[2px] text-slate-300">
              {t('RUANG UNTUK TUMBUH BERSAMA')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
              {t('Punya tempat istimewa?')}
              <br className="sm:hidden" /> {t('Mari bawa lebih jauh.')}
            </h2>
            <p className="mt-3 text-xs leading-6 text-slate-200">
              {t(
                'Perkenalkan properti, venue, atau usaha rental Anda bersama Gobuking.',
              )}
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 bg-white text-primary hover:bg-slate-100"
          >
            <Link href="/info/partner">
              {t('Kenali kemitraan')}
              <ArrowUpRight />
            </Link>
          </Button>
          <Compass
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 top-0 size-52 rotate-12 text-white/[0.04]"
          />
        </div>
        <Link
          href="/info/help"
          className="help-link mx-auto mt-8 flex w-fit min-h-11 items-center gap-2 text-xs text-muted-foreground"
        >
          {t('Butuh bantuan menyusun rencana?')}
          <span className="font-semibold text-primary">
            {t('Kunjungi pusat bantuan')}
          </span>
          <ArrowRight size={14} />
        </Link>
      </section>
    </>
  );
}
