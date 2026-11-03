import { z } from 'zod';
import { SERVICES, type ServiceId } from '@/lib/constants';
export const LOCATIONS = [
  {
    id: 'bali',
    label: 'Bali',
    type: 'Destinasi',
    detail: 'Pulau Bali, Indonesia',
  },
  {
    id: 'yogyakarta',
    label: 'Yogyakarta',
    type: 'Kota',
    detail: 'Daerah Istimewa Yogyakarta',
  },
  {
    id: 'jakarta',
    label: 'Jakarta',
    type: 'Kota',
    detail: 'DKI Jakarta, Indonesia',
  },
  {
    id: 'bandung',
    label: 'Bandung',
    type: 'Kota',
    detail: 'Jawa Barat, Indonesia',
  },
  {
    id: 'lombok',
    label: 'Lombok',
    type: 'Destinasi',
    detail: 'Nusa Tenggara Barat',
  },
  {
    id: 'surabaya',
    label: 'Surabaya',
    type: 'Kota',
    detail: 'Jawa Timur, Indonesia',
  },
  { id: 'ubud', label: 'Ubud', type: 'Area', detail: 'Gianyar, Bali' },
] as const;
export const AIRPORTS = [
  {
    id: 'CGK',
    label: 'Jakarta (CGK)',
    type: 'Bandara',
    detail: 'Soekarno–Hatta',
  },
  {
    id: 'DPS',
    label: 'Bali (DPS)',
    type: 'Bandara',
    detail: 'I Gusti Ngurah Rai',
  },
  {
    id: 'YIA',
    label: 'Yogyakarta (YIA)',
    type: 'Bandara',
    detail: 'Yogyakarta International',
  },
  { id: 'SUB', label: 'Surabaya (SUB)', type: 'Bandara', detail: 'Juanda' },
  {
    id: 'LOP',
    label: 'Lombok (LOP)',
    type: 'Bandara',
    detail: 'Zainuddin Abdul Madjid',
  },
] as const;
export type LocationOption = {
  id: string;
  label: string;
  type: string;
  detail: string;
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const optionalDate = z.string();
export function searchSchema(service: ServiceId) {
  return z
    .object({
      locationId: z.string().min(1, 'Pilih lokasi dari daftar saran.'),
      destinationId: z.string(),
      start: optionalDate,
      end: optionalDate,
      adults: z.number().int().min(1).max(16),
      children: z.number().int().min(0).max(8),
      childAges: z.array(z.string()),
      rooms: z.number().int().min(1).max(8),
      infants: z.number().int().min(0).max(4),
      cabin: z.enum(['economy', 'business']),
      trip: z.enum(['oneway', 'roundtrip']),
      flexible: z.boolean(),
      participants: z
        .number()
        .int()
        .min(1, 'Isi jumlah peserta minimal 1.')
        .max(10000),
      layout: z.enum(['theater', 'classroom', 'banquet', 'seated', 'standing']),
      mode: z.enum(['driver', 'self']),
      startTime: z.string(),
      endTime: z.string(),
      pickup: z.string(),
    })
    .superRefine((data, ctx) => {
      const venue = service === 'mice' || service === 'wedding';
      const needsEnd =
        service === 'hotel' ||
        service === 'home' ||
        service === 'car' ||
        (service === 'flight' && data.trip === 'roundtrip');
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });
      const options = service === 'flight' ? AIRPORTS : LOCATIONS;
      if (!options.some((o) => o.id === data.locationId))
        issue('locationId', 'Pilih lokasi yang tersedia dari daftar.');
      if (!(venue && data.flexible)) {
        if (!data.start) issue('start', 'Pilih tanggal mulai.');
        else if (data.start < localDate())
          issue('start', 'Tanggal tidak boleh sebelum hari ini.');
        if (needsEnd && !data.end) issue('end', 'Pilih tanggal selesai.');
        if (data.start && data.end && needsEnd) {
          if (
            (service === 'hotel' || service === 'home') &&
            data.end <= data.start
          )
            issue('end', 'Check-out harus setelah check-in.');
          else if (data.end < data.start)
            issue('end', 'Tanggal selesai tidak boleh sebelum mulai.');
        }
      }
      if (service === 'flight') {
        if (!AIRPORTS.some((a) => a.id === data.destinationId))
          issue('destinationId', 'Pilih bandara tujuan dari daftar.');
        else if (data.destinationId === data.locationId)
          issue('destinationId', 'Bandara tujuan harus berbeda dari asal.');
        if (data.infants > data.adults)
          issue(
            'infants',
            'Jumlah bayi tidak boleh melebihi dewasa pada demo ini.',
          );
      }
      if (
        (service === 'hotel' || service === 'home') &&
        data.children > 0 &&
        data.childAges.slice(0, data.children).filter(Boolean).length !==
          data.children
      )
        issue('childAges', 'Lengkapi usia setiap anak.');
      if (service === 'car') {
        if (!data.startTime) issue('startTime', 'Pilih jam pengambilan.');
        if (!data.endTime) issue('endTime', 'Pilih jam kembali.');
        if (
          data.start &&
          data.end &&
          data.startTime &&
          data.endTime &&
          `${data.end}T${data.endTime}` <= `${data.start}T${data.startTime}`
        )
          issue('endTime', 'Waktu kembali harus setelah pengambilan.');
        if (!data.pickup.trim())
          issue('pickup', 'Isi area penjemputan atau pengambilan.');
      }
    });
}
export type SearchValues = z.infer<ReturnType<typeof searchSchema>>;
export const DEFAULT_SEARCH: SearchValues = {
  locationId: '',
  destinationId: '',
  start: '',
  end: '',
  adults: 2,
  children: 0,
  childAges: [],
  rooms: 1,
  infants: 0,
  cabin: 'economy',
  trip: 'oneway',
  flexible: false,
  participants: 50,
  layout: 'theater',
  mode: 'driver',
  startTime: '09:00',
  endTime: '21:00',
  pickup: '',
};
export function serializeSearch(service: ServiceId, data: SearchValues) {
  const query = new URLSearchParams({ locationId: data.locationId });
  if ((service === 'mice' || service === 'wedding') && data.flexible)
    query.set('flexible', 'true');
  else {
    query.set('start', data.start);
    if (
      service !== 'mice' &&
      service !== 'wedding' &&
      (service !== 'flight' || data.trip === 'roundtrip')
    )
      query.set('end', data.end);
  }
  if (service === 'hotel' || service === 'home' || service === 'flight') {
    query.set('adults', String(data.adults));
    query.set('children', String(data.children));
  }
  if (service === 'hotel') {
    query.set('rooms', String(data.rooms));
  }
  if ((service === 'hotel' || service === 'home') && data.children)
    query.set('childAges', data.childAges.slice(0, data.children).join(','));
  if (service === 'flight') {
    query.set('destinationId', data.destinationId);
    query.set('trip', data.trip);
    query.set('infants', String(data.infants));
    query.set('cabin', data.cabin);
  }
  if (service === 'mice' || service === 'wedding') {
    query.set('participants', String(data.participants));
    query.set('layout', data.layout);
  }
  if (service === 'car') {
    query.set('mode', data.mode);
    query.set('startTime', data.startTime);
    query.set('endTime', data.endTime);
    query.set('pickup', data.pickup.trim());
  }
  return `${SERVICES.find((s) => s.id === service)!.path}?${query.toString()}`;
}
export function restoreSearch(query: URLSearchParams): SearchValues {
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const n = Number(query.get(key));
    return query.has(key) && Number.isInteger(n) && n >= min && n <= max
      ? n
      : fallback;
  };
  return {
    ...DEFAULT_SEARCH,
    locationId: query.get('locationId') ?? '',
    destinationId: query.get('destinationId') ?? '',
    start: query.get('start') ?? '',
    end: query.get('end') ?? '',
    adults: integer('adults', 2, 1, 16),
    children: integer('children', 0, 0, 8),
    rooms: integer('rooms', 1, 1, 8),
    infants: integer('infants', 0, 0, 4),
    participants: integer('participants', 50, 1, 10000),
    childAges: (query.get('childAges') ?? '')
      .split(',')
      .filter((v) => /^\d{1,2}$/.test(v)),
    flexible: query.get('flexible') === 'true',
    trip: query.get('trip') === 'roundtrip' ? 'roundtrip' : 'oneway',
    cabin: query.get('cabin') === 'business' ? 'business' : 'economy',
    mode: query.get('mode') === 'self' ? 'self' : 'driver',
    layout:
      (['theater', 'classroom', 'banquet', 'seated', 'standing'] as const).find(
        (v) => v === query.get('layout'),
      ) ?? 'theater',
    startTime: query.get('startTime') ?? '09:00',
    endTime: query.get('endTime') ?? '21:00',
    pickup: query.get('pickup') ?? '',
  };
}
