import { describe, expect, it } from 'vitest';
import { createTranslator } from './translate';
import { resolveLocale } from './config';
import { formatRupiah } from '@/lib/utils';
describe('Indonesian and English translations', () => {
  it('uses Indonesian by default and only accepts supported locale values', () => {
    expect(resolveLocale(undefined)).toBe('id');
    expect(resolveLocale('xx')).toBe('id');
    expect(resolveLocale('en')).toBe('en');
    expect(createTranslator('id')('Pilih bahasa')).toBe('Pilih bahasa');
  });
  it('translates copy and validation messages while preserving inline spaces', () => {
    const t = createTranslator('en');
    expect(t('Pilih bahasa')).toBe('Choose language');
    expect(t('Pilih tanggal mulai.')).toBe('Select a start date.');
    expect(t(' Cerita ')).toBe(' Even ');
  });
  it('interpolates counts without translating user-provided values', () => {
    expect(createTranslator('en')('Usia anak {count}', { count: 2 })).toBe(
      'Child 2 age',
    );
    expect(createTranslator('en')('Simpan {0}', { '0': 'Villa Nala' })).toBe(
      'Save Villa Nala',
    );
  });
  it('formats Rupiah according to the selected language without converting currencies', () => {
    expect(formatRupiah(1250000, 'id')).toContain('1.250.000');
    expect(formatRupiah(1250000, 'en')).toContain('1,250,000');
    expect(formatRupiah(1250000, 'en')).toContain('IDR');
  });
});
