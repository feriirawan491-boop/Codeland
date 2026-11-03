import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCALE_FORMATS, type Locale } from '@/lib/i18n/config';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatRupiah(amount: number, locale: Locale = 'id') {
  return new Intl.NumberFormat(LOCALE_FORMATS[locale], {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
