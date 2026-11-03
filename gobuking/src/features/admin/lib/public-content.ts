import type { CmsRecord } from './types';
export function liveCms(now = Date.now()): CmsRecord[] {
  try {
    return typeof window === 'undefined'
      ? []
      : (
          JSON.parse(
            sessionStorage.getItem('gobuking:public-cms:v1') ?? '[]',
          ) as CmsRecord[]
        ).filter(
          (c) =>
            c.status === 'published' &&
            Date.parse(c.startsAt) <= now &&
            Date.parse(c.endsAt) > now,
        );
  } catch {
    return [];
  }
}
export type PublicPromotion = {
  id: string;
  percent: number;
  basis: string;
  fundedBy: string;
  originalBase: number;
  discount: number;
  version: number;
};
export function applyPublicPromotion(
  category: 'hotel' | 'home' | 'car',
  id: string,
  base: number,
) {
  const basis = category === 'car' ? 'unit_rate' : 'nightly_base',
    promo = liveCms().find(
      (c) => c.kind === 'promo' && c.listingId === id && c.basis === basis,
    );
  if (!promo)
    return { base, promotion: undefined as PublicPromotion | undefined };
  const discount = Math.round((base * promo.discountPercent) / 100);
  return {
    base: base - discount,
    promotion: {
      id: promo.id,
      percent: promo.discountPercent,
      basis,
      fundedBy: promo.fundedBy!,
      originalBase: base,
      discount,
      version: promo.version,
    } satisfies PublicPromotion,
  };
}
