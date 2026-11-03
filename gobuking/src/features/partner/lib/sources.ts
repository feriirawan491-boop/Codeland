import { snapshotSubsidy } from '@/features/booking/lib/financial-projection';
import { allDemoBookings } from '@/features/hotel/lib/booking-adapter';
import { bookingPresentation } from '@/features/booking/lib/presentation';
import { carRecords } from '@/features/car/lib/store';
import type { VenueInquiry } from '@/features/venue/lib/types';
import type { PartnerContext, PartnerReservation } from './types';
import { ownListings, partnerGuard, readPartnerStore } from './store';
export function sourceReservations(ctx: PartnerContext): PartnerReservation[] {
  const listings = ownListings(ctx);
  const stays = allDemoBookings().flatMap((b) => {
    const l = listings.find(
      (l) =>
        l.category === (b.home ? 'home' : 'hotel') &&
        l.sourceId === b.quote.propertyId &&
        (l.category !== 'hotel' || l.resourceId === b.quote.resourceId),
    );
    if (!l) return [];
    const p = bookingPresentation(b);
    return [
      {
        id: b.id,
        commissionBps: b.platformPolicy?.commissionBps ?? 1000,
        platformSubsidy: snapshotSubsidy(b.quote),
        listingId: l.id,
        category: l.category,
        name: p?.name ?? l.liveName ?? l.name,
        customerId: b.customerId,
        customerName: b.contact?.name ?? 'Pelanggan',
        email: b.contact?.email ?? '',
        phone: '',
        start: `${b.query.start}T14:00`,
        end: `${b.query.end}T12:00`,
        zone: p?.zone ?? l.zone,
        status:
          b.bookingStatus === 'awaiting_payment' &&
          Date.parse(b.expiresAt) <= Date.now()
            ? 'expired'
            : b.bookingStatus,
        payment: b.paymentStatus,
        total: b.quote.total,
        refund: b.refundAmount,
        refundAt: b.cancellation?.requestedAt ?? null,
        createdAt: b.createdAt,
        version: `${b.bookingStatus}:${b.paymentStatus}:${b.processedCommands.length}`,
        source: 'stay' as const,
      },
    ];
  });
  const cars = Object.values(carRecords()).flatMap((b) => {
    const l = listings.find(
      (l) => l.category === 'car' && l.sourceId === b.offer.id,
    );
    if (!l) return [];
    return [
      {
        id: b.id,
        commissionBps: b.platformPolicy?.commissionBps ?? 1000,
        platformSubsidy: snapshotSubsidy(b.quote),
        listingId: l.id,
        category: l.category,
        name: b.offer.name,
        customerId: b.customerId,
        customerName: b.contact.name,
        email: b.contact.email,
        phone: b.contact.phone,
        start: `${b.query.start}T${b.query.startTime}`,
        end: `${b.query.end}T${b.query.endTime}`,
        zone: l.zone,
        status:
          b.status === 'awaiting_payment' &&
          b.expiresAt &&
          Date.parse(b.expiresAt) <= Date.now()
            ? 'expired'
            : b.status,
        payment: b.payment,
        total: b.quote.total,
        refund: b.refund === 'none' ? 0 : (b.refundAmount ?? b.quote.total),
        refundAt:
          b.refund === 'none' ? null : (b.events.at(-1)?.at ?? b.createdAt),
        createdAt: b.createdAt,
        version: `${b.status}:${b.payment}:${b.commands.length}`,
        source: 'car' as const,
      },
    ];
  });
  return [...stays, ...cars].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
export function inquiryRecords(): Record<string, VenueInquiry> {
  try {
    return JSON.parse(
      sessionStorage.getItem('gobuking:venue-inquiries:v1') ?? '{}',
    );
  } catch {
    return {};
  }
}
export function sourceInquiries(ctx: PartnerContext) {
  const listings = ownListings(ctx);
  return Object.values(inquiryRecords()).flatMap((v) => {
    const l = listings.find(
      (l) => l.category === v.service && l.sourceId === v.spaceId,
    );
    return l ? [{ ...v, listingId: l.id }] : [];
  });
}
export function writeInquiry(v: VenueInquiry) {
  const all = inquiryRecords();
  all[v.id] = v;
  sessionStorage.setItem('gobuking:venue-inquiries:v1', JSON.stringify(all));
  window.dispatchEvent(new Event('gobuking:inquiry-changed'));
}
export function maskedEmail(value: string) {
  const [name, domain] = value.split('@');
  return domain ? `${name.slice(0, 2)}***@${domain}` : '—';
}
export function maskedPhone(value: string) {
  return value ? `•••• ${value.slice(-4)}` : '—';
}
export function visibleActivities() {
  const ctx = partnerGuard('audit'),
    s = readPartnerStore(),
    allowed = ownListings(ctx).map((l) => l.id);
  return s.activities.filter(
    (a) =>
      a.orgId === ctx.organization.id &&
      (!a.listingId || allowed.includes(a.listingId)),
  );
}
