import {
  localDate,
  restoreSearch,
  searchSchema,
  serializeSearch,
} from '@/features/home/lib/search';
import type {
  HotelAmenity,
  HotelFilters,
  HotelQuery,
  HotelScenario,
} from './types';
export const HOTEL_AMENITIES: HotelAmenity[] = [
  'wifi',
  'pool',
  'parking',
  'restaurant',
  'spa',
  'accessible',
];
export const AMENITY_LABELS: Record<HotelAmenity, string> = {
  wifi: 'Wi-Fi',
  pool: 'Kolam renang',
  parking: 'Parkir',
  restaurant: 'Restoran',
  spa: 'Spa',
  accessible: 'Akses kursi roda',
};
export const HOTEL_SCENARIOS: HotelScenario[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'sold_out',
  'price_changed',
  'quote_expired',
  'map_error',
  'unauthorized',
  'forbidden',
  'rate_limited',
  'timeout',
  'inactive',
];
export function datePlus(days: number, date = new Date()) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return localDate(value);
}
export function stayNights(start: string, end: string) {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b)
    ? Math.max(0, Math.round((b - a) / 86400000))
    : 0;
}
export function parseHotelQuery(params: URLSearchParams): HotelQuery {
  const values = restoreSearch(params);
  return {
    locationId: values.locationId || 'bali',
    start: values.start || datePlus(7),
    end: values.end || datePlus(9),
    adults: values.adults,
    children: values.children,
    childAges: values.childAges,
    rooms: values.rooms,
  };
}
export function validateHotelQuery(query: HotelQuery) {
  return searchSchema('hotel')
    .superRefine((data, context) => {
      for (const field of ['start', 'end'] as const) {
        const value = data[field];
        const parsed = new Date(`${value}T00:00:00Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !Number.isFinite(parsed.getTime()) ||
          parsed.toISOString().slice(0, 10) !== value
        )
          context.addIssue({
            code: 'custom',
            path: [field],
            message: 'Masukkan tanggal menginap yang valid.',
          });
      }
      const nights = stayNights(data.start, data.end);
      if (nights < 1 || nights > 60)
        context.addIssue({
          code: 'custom',
          path: ['end'],
          message: 'Pilih durasi menginap antara 1 dan 60 malam.',
        });
    })
    .safeParse({
      ...restoreSearch(new URLSearchParams()),
      ...query,
    });
}
export function parseHotelFilters(params: URLSearchParams): HotelFilters {
  const num = (key: string, fallback: number, min: number, max: number) => {
    const n = Number(params.get(key));
    return params.has(key) && Number.isFinite(n)
      ? Math.min(max, Math.max(min, n))
      : fallback;
  };
  return {
    maxTotal: num('maxTotal', 0, 0, 1000000000),
    minScore: num('minScore', 0, 0, 10),
    stars: (params.get('stars') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => n >= 1 && n <= 5),
    amenities: (params.get('amenities') ?? '')
      .split(',')
      .filter((v): v is HotelAmenity =>
        HOTEL_AMENITIES.includes(v as HotelAmenity),
      ),
    breakfast: params.get('breakfast') === 'true',
    freeCancellation: params.get('freeCancellation') === 'true',
    propertyType: ['hotel', 'resort'].includes(params.get('propertyType') ?? '')
      ? params.get('propertyType')!
      : '',
    sort:
      params.get('sort') === 'price'
        ? 'price'
        : params.get('sort') === 'rating'
          ? 'rating'
          : 'recommended',
    page: Math.floor(num('page', 1, 1, 999)),
    view: params.get('view') === 'map' ? 'map' : 'list',
    keyword: (params.get('keyword') ?? '').slice(0, 100),
    scenario:
      HOTEL_SCENARIOS.find((s) => s === params.get('scenario')) ?? 'ready',
  };
}
export function hotelParams(query: HotelQuery) {
  return new URLSearchParams(
    serializeSearch('hotel', {
      ...restoreSearch(new URLSearchParams()),
      ...query,
    }).split('?')[1],
  );
}
export function queryFromRecord(
  record: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(record).forEach(([key, value]) => {
    if (typeof value === 'string') params.set(key, value);
  });
  return params;
}
export function hotelLink(
  slug: string,
  query: HotelQuery,
  scenario: HotelScenario = 'ready',
) {
  const params = hotelParams(query);
  if (scenario !== 'ready') params.set('scenario', scenario);
  return `/hotels/${slug}?${params}`;
}
