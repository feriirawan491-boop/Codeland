import { applyPublicPromotion } from '@/features/admin/lib/public-content';
import { publicHotels } from '@/features/catalog/lib/runtime';
import {
  partnerSalesOpen,
  partnerResourceOpen,
  partnerResourceDay,
  partnerRateBase,
  partnerResourceVersion,
} from '@/features/partner/lib/public-inventory';
import { maximumResourceHolds } from '@/features/booking/lib/inventory';
import { stayNights, validateHotelQuery } from './query';
import type {
  Hotel,
  HotelFilters,
  HotelQuery,
  HotelQuote,
  HotelResult,
  HotelRoom,
  HotelScenario,
  RoomRate,
} from './types';
export class HotelAdapterError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'HotelAdapterError';
  }
}
export function simulateDelay(
  scenario: HotelScenario = 'ready',
  signal?: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, scenario === 'loading' ? 1300 : 180);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}
export function checkScenario(scenario: HotelScenario) {
  if (scenario === 'inactive')
    throw new HotelAdapterError(
      '404',
      'Properti tidak aktif atau tidak tersedia.',
    );
  if (scenario === 'error')
    throw new HotelAdapterError(
      '500',
      'Layanan demo sedang terganggu. Coba lagi.',
    );
  if (scenario === 'unauthorized')
    throw new HotelAdapterError(
      '401',
      'Sesi demo berakhir. Silakan masuk kembali.',
    );
  if (scenario === 'forbidden')
    throw new HotelAdapterError(
      '403',
      'Anda tidak memiliki akses ke data ini.',
    );
  if (scenario === 'rate_limited')
    throw new HotelAdapterError(
      '429',
      'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
      1,
    );
  if (scenario === 'timeout')
    throw new HotelAdapterError(
      'UNKNOWN',
      'Hasil belum diketahui. Periksa status sebelum mengulangi tindakan.',
    );
}
export function availableStock(
  room: HotelRoom,
  query: HotelQuery,
  scenario: HotelScenario = 'ready',
) {
  if (
    scenario === 'sold_out' ||
    !partnerResourceOpen(room.resourceId, query.start, query.end)
  )
    return 0;
  let stock = Number.POSITIVE_INFINITY;
  for (let night = 0; night < stayNights(query.start, query.end); night++) {
    const date = new Date(`${query.start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + night);
    stock = Math.min(
      stock,
      partnerResourceDay(room.resourceId, date.toISOString().slice(0, 10))
        ?.stock ??
        room.inventoryByDate?.[date.toISOString().slice(0, 10)] ??
        room.stock,
    );
  }
  if (!Number.isFinite(stock)) stock = room.stock;
  return Math.max(
    0,
    stock - maximumResourceHolds(room.resourceId, query.start, query.end),
  );
}
export function makeQuote(
  hotel: Hotel,
  room: HotelRoom,
  rate: RoomRate,
  query: HotelQuery,
  version = '1',
): HotelQuote {
  const nights = stayNights(query.start, query.end);
  const multiplier = version === '2' ? 1.15 : 1;
  const originalBase = Math.round(
    partnerRateBase(room.resourceId, query.start, query.end, rate.nightly) *
      query.rooms *
      multiplier,
  );
  const { base, promotion } = applyPublicPromotion(
    'hotel',
    hotel.id,
    originalBase,
  );
  const tax = Math.round((base * hotel.taxPercent) / 100);
  const serverTime = new Date().toISOString();
  return {
    id: `quote-${hotel.id}-${room.id}-${rate.id}-${query.start}-${query.end}-${query.rooms}-v${version}`,
    version:
      version +
      partnerResourceVersion(room.resourceId) +
      (promotion ? `.promo${promotion.id}.${promotion.version}` : ''),
    promotion,
    propertyId: hotel.id,
    selectionId: room.id,
    resourceId: room.resourceId,
    productType: 'hotel',
    rateId: rate.id,
    quantity: query.rooms,
    nights,
    base,
    tax,
    serviceFee: hotel.serviceFee,
    total: base + tax + hotel.serviceFee,
    currency: 'IDR',
    freeCancellation: rate.freeCancellation,
    breakfast: rate.breakfast,
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    serverTime,
  };
}
export function selectResult(
  hotel: Hotel,
  query: HotelQuery,
  filters: Pick<HotelFilters, 'breakfast' | 'freeCancellation' | 'scenario'>,
): HotelResult | null {
  if (!partnerSalesOpen('hotel', hotel.id)) return null;
  const choices: HotelResult[] = [];
  for (const room of hotel.rooms) {
    if (
      availableStock(room, query, filters.scenario) < query.rooms ||
      room.capacity * query.rooms < query.adults + query.children
    )
      continue;
    for (const rate of room.rates) {
      if (
        (filters.breakfast && !rate.breakfast) ||
        (filters.freeCancellation && !rate.freeCancellation)
      )
        continue;
      choices.push({
        hotel,
        room,
        rate,
        quote: makeQuote(hotel, room, rate, query),
      });
    }
  }
  return choices.sort((a, b) => a.quote.total - b.quote.total)[0] ?? null;
}
export const hotelAdapter = {
  async searchHotels(
    query: HotelQuery,
    filters: HotelFilters,
    signal?: AbortSignal,
  ): Promise<HotelResult[]> {
    await simulateDelay(filters.scenario, signal);
    checkScenario(filters.scenario);
    if (
      !validateHotelQuery(query).success ||
      stayNights(query.start, query.end) > 60
    )
      throw new HotelAdapterError(
        'VALIDATION',
        'Periksa lokasi, tanggal, jumlah tamu, dan usia anak sebelum mencari.',
      );
    if (filters.scenario === 'empty') return [];
    const matches = publicHotels()
      .filter(
        (h) =>
          (query.locationId === 'ubud'
            ? h.area === 'Ubud, Bali'
            : h.locationId === query.locationId) &&
          (!filters.stars.length || filters.stars.includes(h.stars)) &&
          (!filters.minScore || (h.score ?? 0) >= filters.minScore) &&
          (!filters.propertyType || h.propertyType === filters.propertyType) &&
          filters.amenities.every((a) => h.amenities.includes(a)) &&
          (!filters.keyword ||
            h.name.toLowerCase().includes(filters.keyword.toLowerCase())),
      )
      .map((h) => selectResult(h, query, filters))
      .filter((r): r is HotelResult => r !== null)
      .filter((r) => !filters.maxTotal || r.quote.total <= filters.maxTotal);
    return matches.sort((a, b) =>
      filters.sort === 'price'
        ? a.quote.total - b.quote.total
        : filters.sort === 'rating'
          ? (b.hotel.score ?? 0) - (a.hotel.score ?? 0)
          : (b.hotel.score ?? 0) +
            (b.hotel.mode === 'instant' ? 0.2 : 0) -
            ((a.hotel.score ?? 0) + (a.hotel.mode === 'instant' ? 0.2 : 0)),
    );
  },
  async getHotel(
    slug: string,
    scenario: HotelScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await simulateDelay(scenario, signal);
    checkScenario(scenario);
    const hotel = publicHotels().find((h) => h.slug === slug);
    if (!hotel || !partnerSalesOpen('hotel', hotel.id))
      throw new HotelAdapterError(
        '404',
        'Hotel tidak ditemukan atau sedang tidak tersedia.',
      );
    return hotel;
  },
  getHotelById(id: string) {
    return publicHotels().find((h) => h.id === id) ?? null;
  },
  async previewBooking(
    hotel: Hotel,
    roomId: string,
    rateId: string,
    query: HotelQuery,
    scenario: HotelScenario = 'ready',
  ) {
    await simulateDelay(scenario);
    checkScenario(scenario);
    const room = hotel.rooms.find((r) => r.id === roomId);
    const rate = room?.rates.find((r) => r.id === rateId);
    if (!room || !rate)
      throw new HotelAdapterError(
        '404',
        'Pilihan kamar atau tarif sudah tidak tersedia.',
      );
    if (
      !validateHotelQuery(query).success ||
      stayNights(query.start, query.end) > 60
    )
      throw new HotelAdapterError(
        'VALIDATION',
        'Periksa tanggal dan tamu. Maksimal menginap demo adalah 60 malam.',
      );
    if (
      !partnerSalesOpen('hotel', hotel.id) ||
      stayNights(query.start, query.end) <
        (partnerResourceDay(room.resourceId, query.start)?.minStay ?? 1) ||
      availableStock(room, query, scenario) < query.rooms ||
      room.capacity * query.rooms < query.adults + query.children
    )
      throw new HotelAdapterError(
        'SOLD_OUT',
        'Kamar tidak tersedia untuk seluruh tanggal atau jumlah tamu. Ubah pilihan Anda.',
      );
    const quote = makeQuote(
      hotel,
      room,
      rate,
      query,
      scenario === 'price_changed' ? '2' : '1',
    );
    if (scenario === 'quote_expired')
      quote.expiresAt = new Date(Date.now() - 1000).toISOString();
    return quote;
  },
  async listReviews(
    hotel: Pick<Hotel, 'reviews'>,
    sort: 'recent' | 'highest' | 'lowest',
  ) {
    await simulateDelay();
    return [...hotel.reviews].sort((a, b) =>
      sort === 'highest'
        ? b.score - a.score
        : sort === 'lowest'
          ? a.score - b.score
          : b.date.localeCompare(a.date),
    );
  },
};
