import { publicCars } from '@/features/catalog/lib/runtime';
import {
  partnerSalesOpen,
  partnerResourceOpen,
  partnerResourceDay,
} from '@/features/partner/lib/public-inventory';
import { carFixture } from './fixtures';
import { carDelay, CarError } from './error';
import { carQuerySchema, rentalInterval } from './query';
import { rentalQuote } from './pricing';
import { fleetAllocation } from './inventory';
import type { CarQuery, CarFilters, CarScenario, CarResult } from './types';
function validOffer(id: string, q: CarQuery) {
  const parsed = carQuerySchema.safeParse(q);
  if (!parsed.success)
    throw new CarError('VALIDATION', parsed.error.issues[0].message);
  const offer = carFixture(id);
  if (
    !offer ||
    !offer.active ||
    !partnerSalesOpen('car', id) ||
    !partnerResourceOpen(
      `car:${id}`,
      q.start,
      new Date(Date.parse(q.end + 'T00:00:00Z') + 86400000)
        .toISOString()
        .slice(0, 10),
    )
  )
    throw new CarError('404', 'Paket rental tidak aktif atau tidak ditemukan.');
  if (
    offer.locationId !== q.locationId ||
    offer.mode !== q.mode ||
    !offer.areas.includes(q.pickupArea)
  )
    throw new CarError(
      'INCOMPATIBLE',
      'Paket tidak sesuai mode atau area pencarian. Pilih paket lain.',
    );
  if (rentalInterval(q).start - Date.now() < offer.leadHours * 3600000)
    throw new CarError(
      'LEAD_TIME',
      'Jadwal terlalu dekat. Periksa batas pengajuan paket.',
    );
  return {
    ...offer,
    bufferMinutes:
      partnerResourceDay(`car:${id}`, q.start)?.buffer ?? offer.bufferMinutes,
  };
}
export const carAdapter = {
  async searchRentalOffers(
    query: CarQuery,
    filters: CarFilters,
    scenario: CarScenario = 'ready',
    signal?: AbortSignal,
  ): Promise<CarResult[]> {
    const parsed = carQuerySchema.safeParse(query);
    if (!parsed.success)
      throw new CarError('VALIDATION', parsed.error.issues[0].message);
    await carDelay(scenario, signal);
    if (scenario === 'empty') return [];
    const values = publicCars()
      .filter(
        (o) =>
          o.active &&
          partnerSalesOpen('car', o.id) &&
          partnerResourceOpen(
            `car:${o.id}`,
            query.start,
            new Date(Date.parse(query.end + 'T00:00:00Z') + 86400000)
              .toISOString()
              .slice(0, 10),
          ) &&
          o.locationId === query.locationId &&
          o.mode === query.mode &&
          o.areas.includes(query.pickupArea) &&
          (!filters.vehicleClass || o.vehicleClass === filters.vehicleClass) &&
          (!filters.transmission || o.transmission === filters.transmission) &&
          o.seats >= filters.seats &&
          (!filters.baggage ||
            (o.baggage !== null && o.baggage >= filters.baggage)) &&
          (!filters.provider || o.providerId === filters.provider) &&
          (!filters.keyword ||
            `${o.name} ${o.providerName}`
              .toLowerCase()
              .includes(filters.keyword.toLowerCase())) &&
          rentalInterval(query).start - Date.now() >= o.leadHours * 3600000,
      )
      .map((offer) => {
        const allocation = fleetAllocation(offer, query);
        return {
          offer: structuredClone(offer),
          quote: rentalQuote(offer, query, scenario),
          available:
            scenario === 'maintenance' ||
            (scenario === 'driver_busy' && offer.mode === 'driver')
              ? false
              : allocation.available,
          reason:
            scenario === 'maintenance'
              ? 'Armada sedang dalam perawatan.'
              : scenario === 'driver_busy' && offer.mode === 'driver'
                ? 'Pengemudi belum tersedia pada interval ini.'
                : allocation.reason,
          serverTime: new Date().toISOString(),
        };
      })
      .filter((r) => !filters.maxTotal || r.quote.total <= filters.maxTotal);
    return filters.sort === 'total'
      ? values.sort((a, b) => a.quote.total - b.quote.total)
      : values;
  },
  async getRentalOffer(
    id: string,
    query: CarQuery,
    scenario: CarScenario = 'ready',
    signal?: AbortSignal,
  ): Promise<CarResult> {
    await carDelay(scenario, signal);
    const offer = validOffer(id, query),
      allocation = fleetAllocation(offer, query);
    return {
      offer: structuredClone(offer),
      quote: rentalQuote(offer, query, scenario),
      available:
        scenario === 'maintenance' ||
        (scenario === 'driver_busy' && offer.mode === 'driver')
          ? false
          : allocation.available,
      reason:
        scenario === 'maintenance'
          ? 'Armada sedang dalam perawatan.'
          : scenario === 'driver_busy' && offer.mode === 'driver'
            ? 'Pengemudi belum tersedia pada interval ini.'
            : allocation.reason,
      serverTime: new Date().toISOString(),
    };
  },
  async getEligibilityRequirements(id: string) {
    await carDelay();
    const offer = carFixture(id);
    if (!offer)
      throw new CarError(
        '404',
        'Paket rental tidak aktif atau tidak ditemukan.',
      );
    return {
      minAge: offer.minAge,
      license: offer.mode === 'self',
      uploadRequired: offer.uploadRequired,
      leadHours: offer.leadHours,
    };
  },
  previewRentalQuote(
    id: string,
    query: CarQuery,
    scenario: CarScenario = 'ready',
  ) {
    return this.getRentalOffer(id, query, scenario);
  },
};
