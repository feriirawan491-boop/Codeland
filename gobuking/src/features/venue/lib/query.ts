import { z } from 'zod';
import { LOCATIONS, localDate } from '@/features/home/lib/search';
import { LAYOUT_LABELS, VENUE_SCENARIOS, FACILITY_LABELS } from './config';
import type { EventQuery, VenueFilters, VenueScenario } from './types';
export const eventSchema = z
  .object({
    locationId: z.string(),
    start: z.string(),
    end: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    flexible: z.boolean(),
    participants: z
      .number({ error: 'Masukkan jumlah peserta yang valid.' })
      .int()
      .min(1, 'Jumlah peserta minimal 1.')
      .max(2000, 'Maksimal 2.000 peserta pada demo ini.'),
    layout: z.enum([
      'theater',
      'classroom',
      'boardroom',
      'ushape',
      'banquet',
      'standing',
    ]),
    eventType: z.enum(['meeting', 'conference', 'workshop', 'gathering']),
  })
  .superRefine((q, ctx) => {
    const issue = (field: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [field], message });
    if (!LOCATIONS.some((l) => l.id === q.locationId))
      issue('locationId', 'Pilih kota dari daftar saran.');
    if (q.flexible) return;
    const valid = (v: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v;
    if (!valid(q.start)) issue('start', 'Pilih tanggal acara yang valid.');
    else if (q.start < localDate())
      issue('start', 'Tanggal acara tidak boleh sebelum hari ini.');
    if (!valid(q.end)) issue('end', 'Pilih tanggal selesai yang valid.');
    for (const key of ['startTime', 'endTime'] as const)
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(q[key]))
        issue(key, 'Masukkan jam acara yang valid.');
    const start = Date.parse(`${q.start}T${q.startTime}:00Z`),
      end = Date.parse(`${q.end}T${q.endTime}:00Z`);
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      (end <= start || end - start > 72 * 3600000)
    )
      issue('endTime', 'Waktu selesai harus setelah mulai, maksimal 72 jam.');
  });
export function parseEventQuery(p: URLSearchParams): EventQuery {
  return {
    locationId: p.get('locationId') ?? 'jakarta',
    start: p.get('start') ?? '',
    end: p.get('end') ?? p.get('start') ?? '',
    startTime: p.get('startTime') ?? '09:00',
    endTime: p.get('endTime') ?? '17:00',
    flexible: p.has('flexible')
      ? p.get('flexible') === 'true'
      : !p.has('start'),
    participants: p.has('participants') ? Number(p.get('participants')) : 50,
    layout: Object.keys(LAYOUT_LABELS).includes(p.get('layout') ?? '')
      ? (p.get('layout') as EventQuery['layout'])
      : 'theater',
    eventType: ['meeting', 'conference', 'workshop', 'gathering'].includes(
      p.get('eventType') ?? '',
    )
      ? (p.get('eventType') as EventQuery['eventType'])
      : 'meeting',
  };
}
export function eventParams(q: EventQuery) {
  const p = new URLSearchParams({
    locationId: q.locationId,
    participants: String(q.participants),
    layout: q.layout,
    eventType: q.eventType,
  });
  if (q.flexible) p.set('flexible', 'true');
  else {
    p.set('start', q.start);
    p.set('end', q.end);
    p.set('startTime', q.startTime);
    p.set('endTime', q.endTime);
  }
  return p;
}
export function venueScenario(p: URLSearchParams): VenueScenario {
  return VENUE_SCENARIOS.find((s) => s === p.get('scenario')) ?? 'ready';
}
export function venueLink(
  path: string,
  q: EventQuery,
  scenario: VenueScenario = 'ready',
  extras: Record<string, string> = {},
) {
  const p = eventParams(q);
  if (scenario !== 'ready') p.set('scenario', scenario);
  Object.entries(extras).forEach(([key, value]) => {
    if (value) p.set(key, value);
  });
  return `${path}?${p}`;
}
export function parseVenueFilters(p: URLSearchParams): VenueFilters {
  const basis = ['participant', 'hour', 'day', 'quote'].includes(
    p.get('basis') ?? '',
  )
    ? (p.get('basis') as VenueFilters['basis'])
    : '';
  return {
    setting: ['indoor', 'outdoor'].includes(p.get('setting') ?? '')
      ? (p.get('setting') as VenueFilters['setting'])
      : '',
    facilities: (p.get('facilities') ?? '')
      .split(',')
      .filter((f): f is keyof typeof FACILITY_LABELS =>
        Object.hasOwn(FACILITY_LABELS, f),
      ),
    basis,
    maxRate:
      basis && basis !== 'quote'
        ? Math.max(0, Number(p.get('maxRate')) || 0)
        : 0,
    sort:
      basis && basis !== 'quote' && p.get('sort') === 'price'
        ? 'price'
        : 'recommended',
    keyword: p.get('keyword') ?? '',
    page: Math.max(1, Math.floor(Number(p.get('page')) || 1)),
  };
}
