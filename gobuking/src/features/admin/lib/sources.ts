import { snapshotSubsidy } from '@/features/booking/lib/financial-projection';
import {
  allDemoBookings,
  readDemoBooking,
} from '@/features/hotel/lib/booking-adapter';
import { carRecords, saveCarRecord } from '@/features/car/lib/store';
import { bookingPresentation } from '@/features/booking/lib/presentation';
import { readPartnerStore } from '@/features/partner/lib/store';
import type { AdminBooking, AdminContext } from './types';
import { adminScoped, AdminError } from './store';
export function adminBookings(ctx: AdminContext): AdminBooking[] {
  const s = readPartnerStore();
  const stays = allDemoBookings().map((b): AdminBooking => {
    const l = s.listings.find(
        (l) =>
          l.sourceId === b.quote.propertyId &&
          l.category === (b.home ? 'home' : 'hotel') &&
          (l.category !== 'hotel' || l.resourceId === b.quote.resourceId),
      ),
      p = bookingPresentation(b);
    return {
      id: b.id,
      source: 'stay',
      category: b.home ? 'home' : 'hotel',
      orgId: l?.orgId ?? null,
      listingId: l?.id ?? null,
      customerId: b.customerId,
      name: p?.name ?? 'Properti',
      customerName: b.contact?.name ?? 'Pelanggan',
      email: b.contact?.email ?? '',
      status: b.bookingStatus,
      payment: b.paymentStatus,
      refundStatus: b.refundStatus,
      total: b.quote.total,
      paid: b.paymentStatus === 'succeeded' ? b.quote.total : 0,
      refund: b.refundAmount,
      commissionBps: b.platformPolicy?.commissionBps ?? 1000,
      platformSubsidy: snapshotSubsidy(b.quote),
      createdAt: b.createdAt,
      start: b.query.start,
      end: b.query.end,
      zone: p?.zone ?? 'Asia/Jakarta',
      version: `${b.bookingStatus}:${b.paymentStatus}:${b.refundStatus}:${b.refundAmount}:${b.processedCommands.length}`,
      timeline: b.events,
    };
  });
  const cars = Object.values(carRecords()).map((b): AdminBooking => {
    const l = s.listings.find(
      (l) => l.sourceId === b.offer.id && l.category === 'car',
    );
    return {
      id: b.id,
      source: 'car',
      category: 'car',
      orgId: l?.orgId ?? null,
      listingId: l?.id ?? null,
      customerId: b.customerId,
      name: b.offer.name,
      customerName: b.contact.name,
      email: b.contact.email,
      status: b.status,
      payment: b.payment,
      refundStatus: b.refund,
      total: b.quote.total,
      paid: b.payment === 'succeeded' ? b.quote.total : 0,
      refund: b.refund === 'none' ? 0 : (b.refundAmount ?? b.quote.total),
      commissionBps: b.platformPolicy?.commissionBps ?? 1000,
      platformSubsidy: snapshotSubsidy(b.quote),
      createdAt: b.createdAt,
      start: b.query.start,
      end: b.query.end,
      zone: l?.zone ?? 'Asia/Jakarta',
      version: `${b.status}:${b.payment}:${b.refund}:${b.commands.length}`,
      timeline: b.events,
    };
  });
  return [...stays, ...cars]
    .filter((b) => adminScoped(ctx, b.orgId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getAdminBooking(ctx: AdminContext, id: string) {
  const b = adminBookings(ctx).find((b) => b.id === id);
  if (!b)
    throw new AdminError(
      '403',
      'Reservasi tidak tersedia dalam lingkup admin.',
    );
  return b;
}
export function writeSourceRefund(id: string, amount: number, paid: boolean) {
  if (id.startsWith('CAR-')) {
    const b = carRecords()[id];
    if (!b) throw new AdminError('404', 'Reservasi rental tidak ditemukan.');
    b.refund = paid ? 'succeeded' : 'processing';
    b.refundAmount = amount;
    b.events.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      label: paid
        ? 'Refund direkonsiliasi oleh platform'
        : 'Refund disetujui dan sedang diproses platform',
    });
    saveCarRecord(b);
  } else {
    const b = readDemoBooking(id);
    if (!b) throw new AdminError('404', 'Reservasi tidak ditemukan.');
    b.refundAmount = amount;
    b.refundStatus = paid ? 'succeeded' : 'processing';
    b.events.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      label: paid
        ? 'Refund direkonsiliasi oleh platform'
        : 'Refund disetujui dan sedang diproses platform',
    });
    const values = JSON.parse(
      sessionStorage.getItem('gobuking:hotel-bookings:v1') ?? '{}',
    );
    values[id] = b;
    sessionStorage.setItem(
      'gobuking:hotel-bookings:v1',
      JSON.stringify(values),
    );
    window.dispatchEvent(new Event('gobuking:inventory-changed'));
  }
}
