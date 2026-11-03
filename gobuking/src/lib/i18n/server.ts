import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from './config';
import { createTranslator } from './translate';
export async function getI18n() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, t: createTranslator(locale) };
}
