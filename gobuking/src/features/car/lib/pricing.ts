import { applyPublicPromotion } from '@/features/admin/lib/public-content';
import { partnerResourceDay } from '@/features/partner/lib/public-inventory';
import { rentalInterval } from './query';
import type { CarOffer, CarQuery, CarQuote, CarScenario } from './types';
export function rentalQuote(
  offer: CarOffer,
  query: CarQuery,
  scenario: CarScenario = 'ready',
): CarQuote {
  const { start, end } = rentalInterval(query);
  const durationHours = (end - start) / 3600000;
  const units = Math.ceil(durationHours / offer.unitHours);
  const originalUnitRate = Math.round(
    (partnerResourceDay(`car:${offer.id}`, query.start)?.price ?? offer.rate) *
      (scenario === 'price_changed' ? 1.1 : 1),
  );
  const { base: unitRate, promotion } = applyPublicPromotion(
    'car',
    offer.id,
    originalUnitRate,
  );
  const base = Math.round(units * unitRate),
    serviceFee = offer.serviceFee,
    deliveryFee = query.pickupArea === 'central' ? 0 : offer.deliveryFee,
    tax = Math.round(
      ((base + serviceFee + deliveryFee) * offer.taxPercent) / 100,
    );
  return {
    id: `CQ-${crypto.randomUUID()}`,
    version: `${offer.id}:${unitRate}`,
    promotion,
    durationHours,
    units,
    unitHours: offer.unitHours,
    unitRate,
    base,
    serviceFee,
    deliveryFee,
    tax,
    total: base + serviceFee + deliveryFee + tax,
    deposit: offer.deposit,
    expiresAt: new Date(
      Date.now() + (scenario === 'quote_expired' ? -1000 : 5 * 60000),
    ).toISOString(),
    serverTime: new Date().toISOString(),
  };
}
