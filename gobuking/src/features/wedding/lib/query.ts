import { z } from 'zod';
import {
  eventSchema,
  parseEventQuery,
  eventParams,
  venueScenario,
} from '@/features/venue/lib/query';
import { localDate } from '@/features/home/lib/search';
import type {
  WeddingFilters,
  WeddingQuery,
} from '@/features/venue/lib/wedding-types';
export { venueScenario as weddingScenario };
export const weddingQuerySchema = eventSchema.superRefine((value, ctx) => {
  if (
    !value.flexible &&
    (value.start !== value.end ||
      value.startTime < '08:00' ||
      value.endTime > '22:00')
  )
    ctx.addIssue({
      code: 'custom',
      path: ['endTime'],
      message:
        'Acara harus berada dalam jam operasional 08:00–22:00 pada hari yang sama.',
    });
  if (value.layout !== 'banquet' && value.layout !== 'standing')
    ctx.addIssue({
      code: 'custom',
      path: ['layout'],
      message: 'Pilih format tamu duduk atau berdiri.',
    });
});
export function parseWeddingQuery(p: URLSearchParams): WeddingQuery {
  const copy = new URLSearchParams(p);
  copy.set(
    'layout',
    p.get('layout') === 'standing' || p.get('format') === 'standing'
      ? 'standing'
      : 'banquet',
  );
  const query = parseEventQuery(copy);
  return {
    ...query,
    eventType: 'gathering',
    layout: query.layout as WeddingQuery['layout'],
    participants: p.has('participants') ? Number(p.get('participants')) : 100,
  };
}
export function weddingParams(q: WeddingQuery) {
  const p = eventParams(q);
  p.set('layout', q.layout === 'standing' ? 'standing' : 'seated');
  p.delete('eventType');
  return p;
}
export function weddingLink(
  path: string,
  q: WeddingQuery,
  scenario = 'ready',
  extras: Record<string, string> = {},
) {
  const p = weddingParams(q);
  if (scenario !== 'ready') p.set('scenario', scenario);
  Object.entries(extras).forEach(([key, value]) => {
    if (value) p.set(key, value);
  });
  return `${path}?${p}`;
}
export function parseWeddingFilters(p: URLSearchParams): WeddingFilters {
  const budget = Number(p.get('budget'));
  const page = Number(p.get('page'));
  return {
    setting:
      p.get('setting') === 'indoor'
        ? 'indoor'
        : p.get('setting') === 'outdoor'
          ? 'outdoor'
          : '',
    kind: ['ballroom', 'garden', 'resort', 'hall'].includes(p.get('kind') ?? '')
      ? (p.get('kind') as WeddingFilters['kind'])
      : '',
    packageKind:
      p.get('packageKind') === 'venue-only'
        ? 'venue-only'
        : p.get('packageKind') === 'inclusive'
          ? 'inclusive'
          : '',
    budget: Number.isFinite(budget) && budget > 0 ? budget : 0,
    sort: p.get('sort') === 'total' ? 'total' : 'recommended',
    keyword: (p.get('keyword') ?? '').slice(0, 100),
    page: Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1,
  };
}
export const validWeddingDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value &&
  value >= localDate();
export const weddingRequirementsSchema = z
  .object({
    alternativeDates: z
      .array(z.string())
      .max(3, 'Maksimal 3 tanggal alternatif.')
      .transform((values) => values.filter(Boolean))
      .refine(
        (values) => values.every(validWeddingDate),
        'Tanggal alternatif harus valid dan tidak lampau.',
      )
      .refine(
        (values) => new Set(values).size === values.length,
        'Tanggal alternatif tidak boleh berulang.',
      ),
    siteVisit: z.boolean(),
    siteVisitDate: z.string(),
    ceremony: z.enum(['ceremony', 'reception', 'both']),
    decoration: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      value.siteVisit &&
      value.siteVisitDate &&
      !validWeddingDate(value.siteVisitDate)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['siteVisitDate'],
        message: 'Pilih tanggal preferensi site visit yang valid.',
      });
  })
  .transform((value) => ({
    ...value,
    siteVisitDate: value.siteVisit ? value.siteVisitDate : '',
  }));
