import { getI18n } from '@/lib/i18n/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Deals } from '@/features/home/components/deals';
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Penawaran'), robots: { index: false, follow: false } };
}
export default async function OffersPage() {
  const { t } = await getI18n();
  return (
    <main id="main" className="page-container min-h-[65vh] py-12 sm:py-20">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={16} />
        {t('Beranda ')}
      </Link>
      <p className="eyebrow mt-8">{t('RENCANAKAN MOMEN BERIKUTNYA')}</p>
      <h1 className="mb-4 mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {t('Penawaran untuk rencana Anda. ')}
      </h1>
      <p className="mb-9 max-w-xl text-sm leading-7 text-muted-foreground">
        {t(
          'Jelajahi contoh penawaran dan baca syaratnya sebelum menentukan pilihan. Seluruh penawaran pada demo lokal belum dapat digunakan. ',
        )}
      </p>
      <Deals standalone />
    </main>
  );
}
