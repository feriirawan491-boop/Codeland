'use client';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';
import { createTranslator, type Translator } from '@/lib/i18n/translate';
type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  changeLocale: (locale: Locale) => void;
  pending: boolean;
};
const LocaleContext = createContext<LocaleContextValue>({
  locale: 'id',
  t: createTranslator('id'),
  changeLocale: () => {},
  pending: false,
});
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);
  function changeLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    setLocale(next);
    startTransition(() => router.refresh());
  }
  return (
    <LocaleContext.Provider value={{ locale, t, changeLocale, pending }}>
      {children}
    </LocaleContext.Provider>
  );
}
export function useI18n() {
  return useContext(LocaleContext);
}
