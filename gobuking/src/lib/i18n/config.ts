export const LOCALE_COOKIE = 'gobuking-locale';
export const LOCALES = ['id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export function resolveLocale(value: unknown): Locale {
  return value === 'en' ? 'en' : 'id';
}
export const LOCALE_FORMATS: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-GB',
};
