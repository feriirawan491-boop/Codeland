import {
  DEFAULT_SEARCH,
  restoreSearch,
  searchSchema,
  serializeSearch,
} from '@/features/home/lib/search';
import {
  datePlus,
  stayNights,
  parseHotelFilters,
} from '@/features/hotel/lib/query';
import type { HomeAmenity, HomeFilters, HomeQuery } from './types';
export const HOME_AMENITIES: HomeAmenity[] = [
  'wifi',
  'kitchen',
  'pool',
  'parking',
  'air',
  'washer',
  'workspace',
  'garden',
];
export const HOME_AMENITY_LABELS: Record<HomeAmenity, string> = {
  wifi: 'Wi-Fi',
  kitchen: 'Dapur pribadi',
  pool: 'Kolam renang',
  parking: 'Parkir',
  air: 'AC',
  washer: 'Mesin cuci',
  workspace: 'Area kerja',
  garden: 'Taman',
};
export const HOME_TYPE_LABELS = {
  villa: 'Villa',
  house: 'Rumah',
  apartment: 'Apartemen',
};
export function parseHomeQuery(params: URLSearchParams): HomeQuery {
  const values = restoreSearch(params);
  return {
    locationId: values.locationId || 'bali',
    start: values.start || datePlus(7),
    end: values.end || datePlus(9),
    adults: values.adults,
    children: values.children,
    childAges: values.childAges,
    rooms: 1,
  };
}
export function validateHomeQuery(query: HomeQuery) {
  return searchSchema('home')
    .superRefine((data, context) => {
      if (data.rooms !== 1)
        context.addIssue({
          code: 'custom',
          path: ['rooms'],
          message: 'Satu pesanan hanya untuk satu hunian penuh.',
        });
      for (const key of ['start', 'end'] as const) {
        const value = data[key],
          date = new Date(`${value}T00:00:00Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !Number.isFinite(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        )
          context.addIssue({
            code: 'custom',
            path: [key],
            message: 'Masukkan tanggal menginap yang valid.',
          });
      }
      if (
        data.childAges
          .slice(0, data.children)
          .some((age) => !/^(?:[0-9]|1[0-7])$/.test(age))
      )
        context.addIssue({
          code: 'custom',
          path: ['childAges'],
          message: 'Usia anak harus antara 0 dan 17 tahun.',
        });
      const nights = stayNights(data.start, data.end);
      if (nights < 1 || nights > 60)
        context.addIssue({
          code: 'custom',
          path: ['end'],
          message: 'Pilih durasi menginap antara 1 dan 60 malam.',
        });
    })
    .safeParse({ ...DEFAULT_SEARCH, ...query });
}
export function homeParams(query: HomeQuery) {
  return new URLSearchParams(
    serializeSearch('home', { ...DEFAULT_SEARCH, ...query }).split('?')[1],
  );
}
export function parseHomeFilters(params: URLSearchParams): HomeFilters {
  const common = parseHotelFilters(params);
  const number = (key: string, max: number) =>
    Math.max(0, Math.min(max, Math.floor(Number(params.get(key)) || 0)));
  return {
    maxTotal: common.maxTotal,
    minBedrooms: number('minBedrooms', 10),
    minBeds: number('minBeds', 20),
    minBathrooms: number('minBathrooms', 10),
    type: ['villa', 'house', 'apartment'].includes(params.get('type') ?? '')
      ? params.get('type')!
      : '',
    amenities: (params.get('amenities') ?? '')
      .split(',')
      .filter((a): a is HomeAmenity =>
        HOME_AMENITIES.includes(a as HomeAmenity),
      ),
    pets: params.get('pets') === 'true',
    minScore: common.minScore,
    keyword: common.keyword,
    sort: common.sort,
    page: common.page,
    view: common.view,
    scenario: common.scenario,
  };
}
export function homeLink(slug: string, query: HomeQuery, scenario = 'ready') {
  const params = homeParams(query);
  if (scenario !== 'ready') params.set('scenario', scenario);
  return `/homes/${slug}?${params}`;
}
