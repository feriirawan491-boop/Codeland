import type { Metadata } from 'next';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import './globals.css';
import '@/features/account/account.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from 'sonner';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { getI18n } from '@/lib/i18n/server';
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: t('Gobuking — Mulai cerita perjalananmu'),
      template: '%s | Gobuking',
    },
    description: t(
      'Temukan inspirasi hotel, hunian, penerbangan, venue acara, dan rental mobil di Indonesia. Demo lokal Phase 1 Gobuking.',
    ),
    robots: { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <LocaleProvider initialLocale={locale}>
          <a href="#main" className="skip-link">
            {t('Langsung ke konten')}
          </a>
          <Header />
          {children}
          <Footer />
          <Toaster richColors position="bottom-right" closeButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
