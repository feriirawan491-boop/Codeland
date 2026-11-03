import { bookingAdapter } from '@/features/hotel/lib/booking-adapter';
import {
  carBookingAdapter,
  canDownloadCarInvoice,
} from '@/features/car/lib/booking-adapter';
import { canDownloadBookingInvoice } from '@/features/hotel/lib/invoice';
import { bookingPresentation } from '@/features/booking/lib/presentation';
import { CAR_ZONE } from '@/features/car/lib/config';
import { CAR_STATUSES } from '@/features/car/lib/config';
import {
  BOOKING_LABELS,
  PAYMENT_LABELS,
  REFUND_LABELS,
} from '@/features/hotel/lib/booking-labels';
import type { CancellationPreview } from '@/features/booking/lib/cancellation';
import {
  DashboardError,
  requireDashboardAccount,
  assertSameAccount,
  dashboardDelay,
} from './store';
import { filterPeriodError } from './query';
import type {
  DashboardBooking,
  MyBooking,
  ListFilters,
  DashboardScenario,
} from './types';
export function bookingRow(input: MyBooking): DashboardBooking {
  if (input.kind === 'car') {
    const b = input.value;
    return {
      id: b.id,
      category: 'car',
      title: b.assignment?.model ?? b.offer.name,
      subtitle: b.offer.providerName,
      image:
        b.offer.vehicleClass === 'mpv'
          ? 'car-suv'
          : b.offer.image.startsWith('illustration')
            ? 'car-suv'
            : b.offer.image,
      status: b.status,
      payment: b.payment,
      refundStatus: b.refund,
      refundAmount: b.refund === 'none' ? 0 : (b.refundAmount ?? b.quote.total),
      total: b.quote.total,
      createdAt: b.createdAt,
      start: `${b.query.start}T${b.query.startTime}`,
      end: `${b.query.end}T${b.query.endTime}`,
      zone: CAR_ZONE(b.query.locationId),
      completedAt:
        b.events.findLast(
          (e) =>
            e.label ===
            'Pengembalian kendaraan dicatat; rental selesai tanpa tagihan tambahan otomatis',
        )?.at ??
        (b.status === 'completed' ? `${b.query.end}T${b.query.endTime}` : null),
      canInvoice: canDownloadCarInvoice(b),
      canPay:
        b.status === 'awaiting_payment' &&
        !!b.expiresAt &&
        Date.parse(b.expiresAt) > Date.now(),
      canCancel: ['requested', 'awaiting_payment'].includes(b.status),
      history: ['completed', 'cancelled', 'rejected', 'expired'].includes(
        b.status,
      ),
      href: `/bookings/${b.id}`,
    };
  }
  const b = input.value,
    p = input.presentation;
  return {
    id: b.id,
    category: b.home ? 'home' : 'hotel',
    title: p.name,
    subtitle: p.selectionLabel,
    image: b.home?.images[0] ?? 'hotel',
    status: b.bookingStatus,
    payment: b.paymentStatus,
    refundStatus: b.refundStatus,
    refundAmount: b.refundAmount,
    total: b.quote.total,
    createdAt: b.createdAt,
    start: `${b.query.start}T${b.home?.checkIn ?? '14:00'}`,
    end: `${b.query.end}T${b.home?.checkOut ?? '12:00'}`,
    zone: p.zone,
    completedAt:
      b.completedAt ??
      (b.bookingStatus === 'completed' ? `${b.query.end}T12:00` : null),
    canInvoice: canDownloadBookingInvoice(b),
    canPay:
      b.bookingStatus === 'awaiting_payment' &&
      Date.parse(b.expiresAt) > Date.now(),
    canCancel: ['confirmed', 'awaiting_payment'].includes(b.bookingStatus),
    history: ['completed', 'cancelled', 'expired'].includes(b.bookingStatus),
    href: `/bookings/${b.id}`,
  };
}
export function dashboardStatus(row: DashboardBooking) {
  return row.category === 'car'
    ? (CAR_STATUSES[row.status as keyof typeof CAR_STATUSES] ?? row.status)
    : (BOOKING_LABELS[row.status as keyof typeof BOOKING_LABELS] ?? row.status);
}
export function dashboardPayment(row: DashboardBooking) {
  return (
    PAYMENT_LABELS[row.payment as keyof typeof PAYMENT_LABELS] ?? row.payment
  );
}
export function dashboardRefund(row: DashboardBooking) {
  return (
    REFUND_LABELS[row.refundStatus as keyof typeof REFUND_LABELS] ??
    row.refundStatus
  );
}
export async function getMyBooking(id: string): Promise<MyBooking> {
  const account = requireDashboardAccount();
  if (id.startsWith('CAR-DEMO-')) {
    const value = await carBookingAdapter.getBookingStatus(id);
    assertSameAccount(account.id);
    return { kind: 'car', value };
  }
  const value = await bookingAdapter.getBooking(id);
  assertSameAccount(account.id);
  const presentation = bookingPresentation(value);
  if (!presentation)
    throw new DashboardError(
      '404',
      'Informasi produk pada pesanan belum tersedia.',
    );
  return { kind: 'stay', value, presentation };
}
export async function getAllMyBookings() {
  const account = requireDashboardAccount();
  const [stays, cars] = await Promise.all([
    bookingAdapter.listMyBookings(),
    carBookingAdapter.listMyBookings(),
  ]);
  assertSameAccount(account.id);
  const stayRows = stays.flatMap((value) => {
    const presentation = bookingPresentation(value);
    return presentation
      ? [bookingRow({ kind: 'stay', value, presentation })]
      : [];
  });
  return [
    ...stayRows,
    ...cars.map((value) => bookingRow({ kind: 'car', value })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getMyBookings(
  filters: ListFilters,
  history: boolean,
  scenario: DashboardScenario = 'ready',
  signal?: AbortSignal,
) {
  const account = requireDashboardAccount();
  await dashboardDelay(scenario, signal);
  assertSameAccount(account.id);
  const invalid = filterPeriodError(filters);
  if (invalid) throw new DashboardError('VALIDATION', invalid);
  if (scenario === 'empty') return [];
  const values = await getAllMyBookings();
  return values.filter(
    (row) =>
      row.history === history &&
      (!filters.category || row.category === filters.category) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.keyword ||
        `${row.title} ${row.id}`
          .toLowerCase()
          .includes(filters.keyword.toLowerCase())) &&
      (!filters.from ||
        (filters.dateKind === 'created' ? row.createdAt : row.start).slice(
          0,
          10,
        ) >= filters.from) &&
      (!filters.to ||
        (filters.dateKind === 'created' ? row.createdAt : row.start).slice(
          0,
          10,
        ) <= filters.to),
  );
}
export async function previewCancellation(
  id: string,
): Promise<CancellationPreview> {
  const booking = await getMyBooking(id);
  if (booking.kind === 'stay') return bookingAdapter.previewCancellation(id);
  const b = booking.value;
  const eligible = ['requested', 'awaiting_payment'].includes(b.status);
  return {
    id: `CANCEL-${id}`,
    bookingId: id,
    version: `${id}:${b.status}:${b.payment}`,
    total: b.quote.total,
    paid: 0,
    fee: 0,
    refund: 0,
    policy: 'Pembatalan request rental sebelum pembayaran',
    feePercent: 0,
    expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    serverTime: new Date().toISOString(),
    eligible,
    reason: eligible
      ? null
      : 'Pembatalan rental berbayar perlu bantuan mitra. Hubungi CS untuk meninjau kebijakan transaksi.',
  };
}
export async function requestCancellation(
  id: string,
  preview: CancellationPreview,
  reason: string,
  commandId: string,
) {
  const booking = await getMyBooking(id);
  if (reason.trim().length < 5)
    throw new DashboardError(
      'VALIDATION',
      'Isi alasan pembatalan minimal 5 karakter.',
    );
  if (booking.kind === 'stay')
    return bookingAdapter.requestCancellation(id, preview, reason, commandId);
  const current = await previewCancellation(id);
  if (
    !current.eligible ||
    current.version !== preview.version ||
    Date.parse(preview.expiresAt) <= Date.now()
  )
    throw new DashboardError(
      '409',
      'Estimasi pembatalan berubah. Tinjau ulang sebelum menyetujui.',
    );
  return carBookingAdapter.command(id, 'cancel', commandId);
}
