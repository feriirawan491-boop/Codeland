import { applyPublicPromotion } from '@/features/admin/lib/public-content';
import { publicHomes } from '@/features/catalog/lib/runtime';
import {
  partnerSalesOpen,
  partnerResourceOpen,
  partnerResourceDay,
  partnerRateBase,
  partnerResourceVersion,
} from '@/features/partner/lib/public-inventory';
import {
  checkScenario,
  HotelAdapterError,
  simulateDelay,
} from '@/features/hotel/lib/adapter';
import { stayNights } from '@/features/hotel/lib/query';
import {
  resourceReservations,
  shiftDate,
} from '@/features/booking/lib/inventory';
import { validateHomeQuery } from './query';
import type {
  CalendarDay,
  HomeBookingSnapshot,
  HomeDraft,
  HomeFilters,
  HomeProperty,
  HomeQuery,
  HomeQuote,
  HomeResult,
} from './types';
import type { HotelScenario } from '@/features/hotel/lib/types';
const DRAFT_KEY = 'gobuking:home-drafts:v1';
export function calendarDay(
  home: HomeProperty,
  date: string,
  scenario: HotelScenario = 'ready',
): CalendarDay {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: home.zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const day = { date, available: false };
  const partnerBuffer = Math.max(
    home.bufferNights,
    partnerResourceDay(home.resourceId, date)?.buffer ?? 0,
  );
  if (
    !partnerSalesOpen('home', home.id) ||
    !partnerResourceOpen(home.resourceId, date, shiftDate(date, 1))
  )
    return { ...day, reason: 'owner' };
  if (date < today) return { ...day, reason: 'past' };
  if (date < shiftDate(today, home.leadDays)) return { ...day, reason: 'lead' };
  if (scenario === 'sold_out') return { ...day, reason: 'reserved' };
  for (const block of home.ownerBlocks) {
    if (date >= block.start && date < block.end)
      return { ...day, reason: 'owner' };
    if (
      date >= shiftDate(block.start, -partnerBuffer) &&
      date < shiftDate(block.end, partnerBuffer)
    )
      return { ...day, reason: 'buffer' };
  }
  for (const reservation of resourceReservations(home.resourceId)) {
    if (date >= reservation.start && date < reservation.end)
      return { ...day, reason: 'reserved' };
    const buffer = Math.max(reservation.bufferNights || 0, partnerBuffer);
    if (
      date >= shiftDate(reservation.start, -buffer) &&
      date < shiftDate(reservation.end, buffer)
    )
      return { ...day, reason: 'buffer' };
  }
  return { date, available: true, reason: 'available' };
}
export function homeAvailability(
  home: HomeProperty,
  query: HomeQuery,
  scenario: HotelScenario = 'ready',
) {
  if (!validateHomeQuery(query).success)
    return 'Periksa lokasi, tanggal, tamu, dan usia anak.';
  const nights = stayNights(query.start, query.end);
  if (!home.active) return 'Hunian tidak aktif atau tidak tersedia.';
  if (query.adults + query.children > home.maxGuests)
    return 'Jumlah tamu melebihi kapasitas hunian.';
  if (
    nights <
    Math.max(
      home.minNights,
      partnerResourceDay(home.resourceId, query.start)?.minStay ?? 1,
    )
  )
    return 'Durasi menginap belum memenuhi minimum hunian.';
  if (nights > home.maxNights) return 'Durasi menginap melebihi batas hunian.';
  for (let day = query.start; day < query.end; day = shiftDate(day, 1)) {
    const value = calendarDay(home, day, scenario);
    if (!value.available)
      return value.reason === 'lead'
        ? 'Tanggal kedatangan belum memenuhi batas pemesanan.'
        : value.reason === 'buffer'
          ? 'Tanggal pilihan termasuk jeda pembersihan.'
          : 'Hunian tidak tersedia untuk seluruh tanggal yang dipilih.';
  }
  return null;
}
export function makeHomeQuote(
  home: HomeProperty,
  query: HomeQuery,
  extraIds: string[] = [],
  version = '1',
): HomeQuote {
  const nights = stayNights(query.start, query.end);
  const originalBase = Math.round(
    partnerRateBase(home.resourceId, query.start, query.end, home.nightly) *
      (version === '2' ? 1.15 : 1),
  );
  const { base, promotion } = applyPublicPromotion(
    'home',
    home.id,
    originalBase,
  );
  const extras = home.extras
    .filter((extra) => extraIds.includes(extra.id))
    .map((extra) => ({
      id: extra.id,
      label: extra.label,
      total: extra.amount * (extra.basis === 'night' ? nights : 1),
    }));
  const tax = Math.round(
    ((base +
      home.cleaningFee +
      extras.reduce((sum, extra) => sum + extra.total, 0)) *
      home.taxPercent) /
      100,
  );
  const serverTime = new Date().toISOString();
  return {
    id: `home-quote-${home.id}-${query.start}-${query.end}-${extraIds.slice().sort().join('-')}-v${version}`,
    version:
      version +
      partnerResourceVersion(home.resourceId) +
      (promotion ? `.promo${promotion.id}.${promotion.version}` : ''),
    promotion,
    propertyId: home.id,
    selectionId: home.id,
    resourceId: home.resourceId,
    productType: 'home',
    rateId: 'entire-unit',
    quantity: 1,
    nights,
    base,
    cleaningFee: home.cleaningFee,
    extras,
    tax,
    serviceFee: home.serviceFee,
    total:
      base +
      home.cleaningFee +
      extras.reduce((sum, extra) => sum + extra.total, 0) +
      tax +
      home.serviceFee,
    currency: 'IDR',
    breakfast: false,
    freeCancellation: home.freeCancellation,
    serverTime,
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
  };
}
export function homeSnapshot(
  home: HomeProperty,
  start?: string,
): HomeBookingSnapshot {
  return {
    id: home.id,
    slug: home.slug,
    name: home.name,
    area: home.area,
    type: home.type,
    bedrooms: home.bedrooms,
    beds: home.beds,
    bathrooms: home.bathrooms,
    maxGuests: home.maxGuests,
    images: [...home.images],
    hostName: home.host.name,
    rules: { ...home.rules },
    checkIn: home.checkIn,
    checkOut: home.checkOut,
    zone: home.zone,
    bufferNights:
      (start
        ? partnerResourceDay(home.resourceId, start)?.buffer
        : undefined) ?? home.bufferNights,
    minNights: home.minNights,
    deposit: { ...home.deposit },
    rulesAccepted: true,
  };
}
export function createHomeDraft(value: Omit<HomeDraft, 'id'>) {
  const draft = { ...value, id: `HOME-DRAFT-${crypto.randomUUID()}` };
  const drafts = JSON.parse(
    sessionStorage.getItem(DRAFT_KEY) ?? '{}',
  ) as Record<string, HomeDraft>;
  drafts[draft.id] = draft;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  return draft;
}
export function readHomeDraft(id: string): HomeDraft | null {
  try {
    return (
      (
        JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Record<
          string,
          HomeDraft
        >
      )[id] ?? null
    );
  } catch {
    return null;
  }
}
export function updateHomeDraft(draft: HomeDraft) {
  const drafts = JSON.parse(
    sessionStorage.getItem(DRAFT_KEY) ?? '{}',
  ) as Record<string, HomeDraft>;
  drafts[draft.id] = draft;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
}
export const homeAdapter = {
  async searchHomes(
    query: HomeQuery,
    filters: HomeFilters,
    signal?: AbortSignal,
  ): Promise<HomeResult[]> {
    await simulateDelay(filters.scenario, signal);
    checkScenario(filters.scenario);
    if (!validateHomeQuery(query).success)
      throw new HotelAdapterError(
        'VALIDATION',
        'Periksa lokasi, tanggal, tamu, dan usia anak.',
      );
    if (filters.scenario === 'empty') return [];
    return publicHomes()
      .filter(
        (home) =>
          (query.locationId === 'ubud'
            ? home.area === 'Ubud, Bali'
            : home.locationId === query.locationId) &&
          home.active &&
          home.bedrooms >= filters.minBedrooms &&
          home.beds >= filters.minBeds &&
          home.bathrooms >= filters.minBathrooms &&
          (!filters.type || home.type === filters.type) &&
          (!filters.pets || home.rules.pets) &&
          (!filters.minScore || (home.score ?? 0) >= filters.minScore) &&
          filters.amenities.every((a) => home.amenities.includes(a)) &&
          (!filters.keyword ||
            home.name.toLowerCase().includes(filters.keyword.toLowerCase())) &&
          !homeAvailability(home, query, filters.scenario),
      )
      .map((home) => ({ home, quote: makeHomeQuote(home, query) }))
      .filter(
        (result) => !filters.maxTotal || result.quote.total <= filters.maxTotal,
      )
      .sort((a, b) =>
        filters.sort === 'price'
          ? a.quote.total - b.quote.total
          : (b.home.score ?? 0) - (a.home.score ?? 0),
      );
  },
  async getHome(
    slug: string,
    scenario: HotelScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await simulateDelay(scenario, signal);
    checkScenario(scenario);
    const home = publicHomes().find(
      (home) =>
        home.slug === slug && home.active && partnerSalesOpen('home', home.id),
    );
    if (!home)
      throw new HotelAdapterError(
        '404',
        'Hunian tidak aktif atau tidak tersedia.',
      );
    return home;
  },
  getHomeById(id: string) {
    return publicHomes().find((home) => home.id === id && home.active) ?? null;
  },
  async getUnitCalendar(
    home: HomeProperty,
    start: string,
    end: string,
    scenario: HotelScenario = 'ready',
    signal?: AbortSignal,
  ) {
    await simulateDelay(scenario, signal);
    checkScenario(scenario);
    const days: CalendarDay[] = [];
    for (
      let day = start;
      day < end && days.length < 93;
      day = shiftDate(day, 1)
    )
      days.push(calendarDay(home, day, scenario));
    return days;
  },
  async previewHomeQuote(
    home: HomeProperty,
    query: HomeQuery,
    extraIds: string[] = [],
    scenario: HotelScenario = 'ready',
  ) {
    await simulateDelay(scenario);
    checkScenario(scenario);
    const invalid = homeAvailability(home, query, scenario);
    if (invalid) throw new HotelAdapterError('UNAVAILABLE', invalid);
    if (extraIds.some((id) => !home.extras.some((extra) => extra.id === id)))
      throw new HotelAdapterError(
        'VALIDATION',
        'Pilihan layanan tambahan tidak tersedia.',
      );
    const quote = makeHomeQuote(
      home,
      query,
      extraIds,
      scenario === 'price_changed' ? '2' : '1',
    );
    if (scenario === 'quote_expired')
      quote.expiresAt = new Date(0).toISOString();
    return quote;
  },
  async refreshQuote(draft: HomeDraft) {
    const home = this.getHomeById(draft.homeId);
    if (!home)
      throw new HotelAdapterError(
        '404',
        'Hunian tidak aktif atau tidak tersedia.',
      );
    const quote = await this.previewHomeQuote(
      home,
      draft.query,
      draft.extraIds,
    );
    const next = { ...draft, quote, scenario: 'ready' as const };
    updateHomeDraft(next);
    return next;
  },
};
