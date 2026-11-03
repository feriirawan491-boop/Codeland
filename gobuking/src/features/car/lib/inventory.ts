import {
  partnerResourceDay,
  partnerResourceOpen,
} from '@/features/partner/lib/public-inventory';
import { carRecords, readCarStore } from './store';
import { rentalInterval } from './query';
import type { CarOffer, CarQuery } from './types';
const KEY = 'gobuking:car-maintenance:v1';
export const unitPool = (o: CarOffer) => [
  `${o.locationId}:${o.providerId}:${o.vehicleClass}:01`,
  `${o.locationId}:${o.providerId}:${o.vehicleClass}:02`,
];
const driverPool = (o: CarOffer) => [
  `${o.locationId}:${o.providerId}:driver:01`,
];
export function setCarMaintenance(unitId: string, start: number, end: number) {
  const values = readCarStore<{ start: number; end: number }[]>(KEY);
  values[unitId] = [...(values[unitId] ?? []), { start, end }];
  sessionStorage.setItem(KEY, JSON.stringify(values));
  window.dispatchEvent(new Event('gobuking:car-inventory-changed'));
}
function conflicts(
  id: string,
  q: CarQuery,
  offer: CarOffer,
  type: 'unitId' | 'driverId',
  exclude?: string,
) {
  const interval = rentalInterval(q);
  return Object.values(carRecords()).some((b) => {
    if (b.id === exclude || b[type] !== id) return false;
    const holds =
      ['confirmed', 'in_use'].includes(b.status) ||
      (b.status === 'awaiting_payment' &&
        !!b.expiresAt &&
        Date.parse(b.expiresAt) > Date.now());
    if (!holds) return false;
    const other = rentalInterval(b.query);
    return (
      interval.start < other.end + b.offer.bufferMinutes * 60000 &&
      interval.end + offer.bufferMinutes * 60000 > other.start
    );
  });
}
export function unitFree(
  id: string,
  q: CarQuery,
  offer: CarOffer,
  exclude?: string,
) {
  const interval = rentalInterval(q);
  return (
    !conflicts(id, q, offer, 'unitId', exclude) &&
    !(readCarStore<{ start: number; end: number }[]>(KEY)[id] ?? []).some(
      (block) =>
        interval.start < block.end &&
        interval.end + offer.bufferMinutes * 60000 > block.start,
    )
  );
}
export function driverFree(
  id: string,
  q: CarQuery,
  offer: CarOffer,
  exclude?: string,
) {
  return !conflicts(id, q, offer, 'driverId', exclude);
}
export function fleetAllocation(
  offer: CarOffer,
  q: CarQuery,
  exclude?: string,
) {
  let cap = 2;
  for (
    let day = Date.parse(q.start + 'T00:00:00Z');
    day <= Date.parse(q.end + 'T00:00:00Z');
    day += 86400000
  )
    cap = Math.min(
      cap,
      partnerResourceDay(
        `car:${offer.id}`,
        new Date(day).toISOString().slice(0, 10),
      )?.stock ?? 2,
    );
  const interval = rentalInterval(q);
  const held = Object.values(carRecords()).filter(
    (b) =>
      b.id !== exclude &&
      b.offer.id === offer.id &&
      (['confirmed', 'in_use'].includes(b.status) ||
        (b.status === 'awaiting_payment' &&
          !!b.expiresAt &&
          Date.parse(b.expiresAt) > Date.now())) &&
      rentalInterval(b.query).start < interval.end &&
      rentalInterval(b.query).end > interval.start,
  ).length;
  if (
    held >= cap ||
    !partnerResourceOpen(
      `car:${offer.id}`,
      q.start,
      new Date(Date.parse(q.end + 'T00:00:00Z') + 86400000)
        .toISOString()
        .slice(0, 10),
    )
  )
    return {
      unitId: null,
      driverId: null,
      available: false,
      reason: 'Armada ditutup atau kapasitas kalender tidak mencukupi.',
    };
  const unitId = unitPool(offer).find((id) => unitFree(id, q, offer, exclude));
  const driverId =
    offer.mode === 'driver'
      ? driverPool(offer).find(
          (id) => !conflicts(id, q, offer, 'driverId', exclude),
        )
      : null;
  return {
    unitId: unitId ?? null,
    driverId: driverId ?? null,
    available: !!unitId && (offer.mode !== 'driver' || !!driverId),
    reason: !unitId
      ? 'Armada belum tersedia pada interval dan buffer ini.'
      : offer.mode === 'driver' && !driverId
        ? 'Pengemudi belum tersedia pada interval ini.'
        : null,
  };
}
