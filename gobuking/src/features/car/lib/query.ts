import { z } from 'zod';
import { LOCATIONS, localDate } from '@/features/home/lib/search';
import { CAR_AREAS, CAR_OFFSET, CAR_SCENARIOS } from './config';
import type { CarQuery, CarFilters, CarScenario } from './types';
export function rentalInterval(q: CarQuery) {
  const suffix = `+${String(CAR_OFFSET(q.locationId)).padStart(2, '0')}:00`;
  return {
    start: Date.parse(`${q.start}T${q.startTime}:00${suffix}`),
    end: Date.parse(`${q.end}T${q.endTime}:00${suffix}`),
  };
}
const validDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export const carQuerySchema = z
  .object({
    locationId: z.string(),
    pickupArea: z.string(),
    returnArea: z.string(),
    start: z.string(),
    end: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    mode: z.enum(['driver', 'self']),
  })
  .superRefine((q, ctx) => {
    const issue = (field: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [field], message });
    if (!LOCATIONS.some((l) => l.id === q.locationId))
      issue('locationId', 'Pilih kota pengambilan dari daftar.');
    if (!Object.hasOwn(CAR_AREAS, q.pickupArea))
      issue('pickupArea', 'Pilih area pengambilan yang tersedia.');
    if (q.returnArea !== q.pickupArea)
      issue(
        'returnArea',
        'Pengembalian harus pada area yang sama dengan pengambilan.',
      );
    if (!validDate(q.start) || q.start < localDate())
      issue('start', 'Pilih tanggal pengambilan yang valid dan tidak lampau.');
    if (!validDate(q.end))
      issue('end', 'Pilih tanggal pengembalian yang valid.');
    for (const key of ['startTime', 'endTime'] as const)
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(q[key]))
        issue(key, 'Masukkan jam pengambilan dan pengembalian yang valid.');
    const interval = rentalInterval(q);
    if (
      Number.isFinite(interval.start) &&
      Number.isFinite(interval.end) &&
      (interval.end <= interval.start ||
        interval.end - interval.start > 30 * 86400000)
    )
      issue(
        'endTime',
        'Waktu kembali harus setelah pengambilan, maksimal 30 hari.',
      );
  });
export function parseCarQuery(p: URLSearchParams): CarQuery {
  return {
    locationId: p.get('locationId') ?? 'jakarta',
    pickupArea:
      p.get('pickupArea') ??
      (/bandara|airport/i.test(p.get('pickup') ?? '') ? 'airport' : 'central'),
    returnArea:
      p.get('returnArea') ??
      p.get('pickupArea') ??
      (/bandara|airport/i.test(p.get('pickup') ?? '') ? 'airport' : 'central'),
    start: p.get('start') ?? '',
    end: p.get('end') ?? '',
    startTime: p.get('startTime') ?? '09:00',
    endTime: p.get('endTime') ?? '09:00',
    mode: p.get('mode') === 'self' ? 'self' : 'driver',
  };
}
export function carParams(q: CarQuery) {
  return new URLSearchParams({ ...q });
}
export function carLink(
  path: string,
  q: CarQuery,
  scenario: CarScenario = 'ready',
  extras: Record<string, string> = {},
) {
  const p = carParams(q);
  if (scenario !== 'ready') p.set('scenario', scenario);
  for (const [key, value] of Object.entries(extras))
    if (value) p.set(key, value);
  return `${path}?${p}`;
}
export function carScenario(p: URLSearchParams): CarScenario {
  return CAR_SCENARIOS.includes(p.get('scenario') as CarScenario)
    ? (p.get('scenario') as CarScenario)
    : 'ready';
}
export function parseCarFilters(p: URLSearchParams): CarFilters {
  const n = (key: string) =>
    Number.isFinite(Number(p.get(key))) ? Math.max(0, Number(p.get(key))) : 0;
  return {
    vehicleClass: ['city', 'mpv', 'suv', 'van'].includes(
      p.get('vehicleClass') ?? '',
    )
      ? (p.get('vehicleClass') as CarFilters['vehicleClass'])
      : '',
    transmission: ['automatic', 'manual'].includes(p.get('transmission') ?? '')
      ? (p.get('transmission') as CarFilters['transmission'])
      : '',
    seats: Math.min(16, Math.floor(n('seats'))),
    baggage: Math.min(10, Math.floor(n('baggage'))),
    provider: (p.get('provider') ?? '').slice(0, 100),
    maxTotal: n('maxTotal'),
    keyword: (p.get('keyword') ?? '').slice(0, 100),
    sort: p.get('sort') === 'total' ? 'total' : 'recommended',
    page: Math.max(1, Math.floor(n('page'))),
  };
}
export const renterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Isi nama penyewa minimal 2 karakter.')
    .max(100),
  age: z
    .number({ error: 'Isi usia penyewa dengan angka.' })
    .int()
    .min(17, 'Usia penyewa minimal 17 tahun pada demo.')
    .max(100),
  license: z.boolean(),
  eligibility: z
    .boolean()
    .refine(Boolean, 'Tinjau dan setujui pemeriksaan kelayakan mitra.'),
  pickupDetail: z
    .string()
    .trim()
    .min(5, 'Isi titik pengambilan yang cukup jelas.')
    .max(300),
  notes: z.string().trim().max(1000, 'Catatan maksimal 1.000 karakter.'),
  consent: z
    .boolean()
    .refine(Boolean, 'Setujui ketentuan rental sebelum mengajukan.'),
});
