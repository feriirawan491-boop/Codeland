import english from './en.json';
import type { Locale } from './config';
export type TranslationValues = Record<string, string | number>;
export type Translator = (
  source: string | undefined,
  values?: TranslationValues,
) => string;
const messages: Readonly<Record<string, string>> = english;
export function createTranslator(locale: Locale): Translator {
  return (source = '', values = {}) => {
    const key = source.replace(/\s+/g, ' ').trim();
    const message = locale === 'en' ? messages[key] : undefined;
    const translated =
      message === undefined
        ? source
        : `${source.match(/^\s*/)?.[0] ?? ''}${message}${source.match(/\s*$/)?.[0] ?? ''}`;
    return translated.replace(/\{(\w+)\}/g, (match, name: string) =>
      String(values[name] ?? match),
    );
  };
}
