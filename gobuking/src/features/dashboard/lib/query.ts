import { z } from 'zod';
import type { DashboardScenario, ListFilters } from './types';
export const DASHBOARD_SCENARIOS: DashboardScenario[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'timeout',
  'rate_limited',
  'unauthorized',
  'forbidden',
  'mutation_timeout',
];
export function dashboardScenario(p: URLSearchParams): DashboardScenario {
  return DASHBOARD_SCENARIOS.includes(p.get('scenario') as DashboardScenario)
    ? (p.get('scenario') as DashboardScenario)
    : 'ready';
}
export function parseListFilters(p: URLSearchParams): ListFilters {
  const page = Number(p.get('page'));
  return {
    category: ['hotel', 'home', 'car', 'mice', 'wedding'].includes(
      p.get('category') ?? '',
    )
      ? p.get('category')!
      : '',
    status: (p.get('status') ?? '').slice(0, 50),
    dateKind: p.get('dateKind') === 'created' ? 'created' : 'service',
    from: p.get('from') ?? '',
    to: p.get('to') ?? '',
    keyword: (p.get('keyword') ?? '').slice(0, 100),
    page: Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1,
  };
}
export const realDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export function filterPeriodError(f: Pick<ListFilters, 'from' | 'to'>) {
  if ((f.from && !realDate(f.from)) || (f.to && !realDate(f.to)))
    return 'Masukkan periode tanggal yang valid.';
  if (f.from && f.to && f.from > f.to)
    return 'Tanggal akhir periode harus setelah atau sama dengan tanggal awal.';
  return null;
}
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Isi nama minimal 2 karakter.').max(100),
  language: z.enum(['id', 'en']),
  emailUpdates: z.boolean(),
});
export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  score: z
    .number({ error: 'Pilih nilai ulasan 1–10.' })
    .int()
    .min(1, 'Pilih nilai ulasan 1–10.')
    .max(10),
  title: z.string().trim().min(5, 'Judul ulasan minimal 5 karakter.').max(120),
  body: z
    .string()
    .trim()
    .min(20, 'Ceritakan pengalaman minimal 20 karakter.')
    .max(2000),
  subscore: z.number().int().min(1).max(10).nullable(),
});
export const ticketSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(5, 'Subjek tiket minimal 5 karakter.')
      .max(120),
    category: z.enum([
      'general',
      'booking',
      'inquiry',
      'privacy_access',
      'privacy_correction',
      'privacy_delete',
    ]),
    referenceId: z.string().max(100),
    body: z.string().trim().min(20, 'Pesan minimal 20 karakter.').max(3000),
  })
  .superRefine((v, ctx) => {
    if (['booking', 'inquiry'].includes(v.category) && !v.referenceId)
      ctx.addIssue({
        code: 'custom',
        path: ['referenceId'],
        message: 'Pilih pesanan atau inquiry terkait.',
      });
  });
