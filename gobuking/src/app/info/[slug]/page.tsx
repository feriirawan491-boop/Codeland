import { getI18n } from '@/lib/i18n/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { INFO_PAGES } from '@/lib/constants';
export default async function InfoPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { t } = await getI18n();
  const { slug } = await params;
  if (!(slug in INFO_PAGES)) notFound();
  const page = INFO_PAGES[slug as keyof typeof INFO_PAGES];
  return (
    <main id="main" className="page-container min-h-[65vh] py-12 sm:py-20">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={16} />
        {t('Beranda ')}
      </Link>
      <div className="mb-10 mt-8 max-w-2xl">
        <p className="eyebrow">{t('GOBUKING \u00B7 DEMO PHASE 1')}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {t(page.title)}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          {t(page.intro)}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {page.sections.map(([title, body]) => (
          <section
            key={title}
            className="rounded-xl border border-border bg-white p-6"
          >
            <h2 className="text-base font-semibold">{t(title)}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(body)}
            </p>
          </section>
        ))}
      </div>
      <Link
        href="/#search"
        className="mt-10 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
      >
        {t('Mulai jelajahi ')}
        <ArrowUpRight size={17} />
      </Link>
    </main>
  );
}
