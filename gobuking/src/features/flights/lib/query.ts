import { z } from 'zod';
import {
  DEMO_FLIGHT_RULES,
  FLIGHT_SCENARIOS,
  flightAirport,
  FLIGHT_AIRLINES,
} from './config';
import type { FlightFilters, FlightQuery, FlightScenario } from './types';
export const flightSchema = z
  .object({
    locationId: z.string().min(1, 'Pilih bandara asal dari daftar.'),
    destinationId: z.string().min(1, 'Pilih bandara tujuan dari daftar.'),
    start: z.string().min(1, 'Pilih tanggal berangkat.'),
    end: z.string().optional(),
    trip: z.enum(['oneway', 'roundtrip']),
    adults: z
      .number({ error: 'Masukkan jumlah penumpang yang valid.' })
      .int('Jumlah penumpang harus bilangan bulat.')
      .min(1, 'Minimal satu penumpang dewasa.')
      .max(
        DEMO_FLIGHT_RULES.maxSeated,
        'Maksimal 9 penumpang dengan kursi pada konfigurasi demo.',
      ),
    children: z
      .number({ error: 'Masukkan jumlah penumpang yang valid.' })
      .int('Jumlah penumpang harus bilangan bulat.')
      .min(0, 'Jumlah penumpang tidak boleh negatif.')
      .max(
        DEMO_FLIGHT_RULES.maxSeated - 1,
        'Maksimal 8 anak pada konfigurasi demo.',
      ),
    infants: z
      .number({ error: 'Masukkan jumlah penumpang yang valid.' })
      .int('Jumlah penumpang harus bilangan bulat.')
      .min(0, 'Jumlah penumpang tidak boleh negatif.')
      .max(
        DEMO_FLIGHT_RULES.maxInfants,
        'Maksimal 4 bayi pada konfigurasi demo.',
      ),
    cabin: z.enum(['economy', 'business']),
  })
  .superRefine((q, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    const origin = flightAirport(q.locationId);
    if (!origin) issue('locationId', 'Pilih bandara asal dari daftar.');
    if (!flightAirport(q.destinationId))
      issue('destinationId', 'Pilih bandara tujuan dari daftar.');
    if (q.locationId && q.locationId === q.destinationId)
      issue('destinationId', 'Bandara tujuan harus berbeda dari asal.');
    const validDate = (v: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v;
    if (!validDate(q.start))
      issue('start', 'Masukkan tanggal berangkat yang valid.');
    if (origin && validDate(q.start)) {
      const parts = new Intl.DateTimeFormat('en', {
        timeZone: origin.zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());
      const part = (key: string) => parts.find((p) => p.type === key)!.value;
      if (q.start < `${part('year')}-${part('month')}-${part('day')}`)
        issue('start', 'Tanggal berangkat tidak boleh sebelum hari ini.');
    }
    if (q.trip === 'roundtrip') {
      if (!q.end || !validDate(q.end))
        issue('end', 'Pilih tanggal pulang yang valid.');
      else if (q.end < q.start)
        issue('end', 'Tanggal pulang tidak boleh sebelum berangkat.');
    }
    if (q.adults + q.children > DEMO_FLIGHT_RULES.maxSeated)
      issue(
        'adults',
        'Maksimal 9 penumpang dengan kursi pada konfigurasi demo.',
      );
    if (q.infants > q.adults * DEMO_FLIGHT_RULES.infantsPerAdult)
      issue(
        'infants',
        'Jumlah bayi tidak boleh melebihi dewasa pada demo ini.',
      );
  })
  .transform((q) => ({
    ...q,
    end: q.trip === 'roundtrip' ? q.end : undefined,
  }));
export function parseFlightQuery(p: URLSearchParams): FlightQuery {
  const count = (key: string, fallback: number) =>
    p.has(key) ? Number(p.get(key)) : fallback;
  return {
    locationId: p.get('locationId') ?? '',
    destinationId: p.get('destinationId') ?? '',
    start: p.get('start') ?? '',
    end: p.get('trip') === 'roundtrip' ? (p.get('end') ?? '') : undefined,
    trip: p.get('trip') === 'roundtrip' ? 'roundtrip' : 'oneway',
    adults: count('adults', 2),
    children: count('children', 0),
    infants: count('infants', 0),
    cabin: p.get('cabin') === 'business' ? 'business' : 'economy',
  };
}
export function flightParams(q: FlightQuery) {
  const p = new URLSearchParams({
    locationId: q.locationId,
    destinationId: q.destinationId,
    start: q.start,
    trip: q.trip,
    adults: String(q.adults),
    children: String(q.children),
    infants: String(q.infants),
    cabin: q.cabin,
  });
  if (q.trip === 'roundtrip' && q.end) p.set('end', q.end);
  return p;
}
export function flightScenario(p: URLSearchParams): FlightScenario {
  return FLIGHT_SCENARIOS.find((s) => s === p.get('scenario')) ?? 'ready';
}
export function parseFlightFilters(p: URLSearchParams): FlightFilters {
  return {
    airlines: (p.get('airlines') ?? '')
      .split(',')
      .filter((id) => FLIGHT_AIRLINES.some((a) => a.id === id)),
    stops:
      p.get('stops') === 'direct'
        ? 'direct'
        : p.get('stops') === 'one'
          ? 'one'
          : 'all',
    departure: ['morning', 'afternoon', 'evening'].includes(
      p.get('departure') ?? '',
    )
      ? (p.get('departure') as FlightFilters['departure'])
      : 'all',
    sort:
      p.get('sort') === 'price'
        ? 'price'
        : p.get('sort') === 'duration'
          ? 'duration'
          : 'recommended',
    page: Math.max(1, Math.floor(Number(p.get('page')) || 1)),
  };
}
export function flightLink(
  path: string,
  q: FlightQuery,
  scenario: FlightScenario = 'ready',
  extras: Record<string, string> = {},
) {
  const p = flightParams(q);
  if (scenario !== 'ready') p.set('scenario', scenario);
  Object.entries(extras).forEach(([key, value]) => {
    if (value) p.set(key, value);
  });
  return `${path}?${p}`;
}
