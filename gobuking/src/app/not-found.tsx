'use client';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n/locale-provider';
export default function NotFound() {
  const { t } = useI18n();
  return (
    <main
      id="main"
      className="page-container flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center"
    >
      <Compass size={45} />
      <p className="eyebrow">{t('404 · HALAMAN TIDAK DITEMUKAN')}</p>
      <h1 className="text-3xl font-bold">
        {t('Sepertinya kita berbelok terlalu jauh.')}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t('Kembali ke beranda untuk memulai cerita baru.')}
      </p>
      <Button asChild>
        <Link href="/">{t('Kembali ke beranda')}</Link>
      </Button>
    </main>
  );
}
