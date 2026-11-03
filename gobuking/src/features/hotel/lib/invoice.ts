import type { BookingInvoice, DemoBooking } from './types';
export function canDownloadBookingInvoice(booking: DemoBooking) {
  return Boolean(
    booking.invoice &&
    booking.paymentStatus === 'succeeded' &&
    ['confirmed', 'completed', 'cancelled'].includes(booking.bookingStatus),
  );
}
export function issueDemoInvoice(
  booking: DemoBooking,
  recipientEmail: string,
  paidAt: string | null,
  issuedAt = new Date().toISOString(),
): BookingInvoice {
  if (
    booking.paymentStatus !== 'succeeded' ||
    !['confirmed', 'completed', 'cancelled'].includes(booking.bookingStatus)
  )
    throw new Error(
      'Invoice tersedia setelah pembayaran berhasil dan reservasi terkonfirmasi.',
    );
  return {
    number: `INV-${booking.id}`,
    issuedAt,
    paidAt,
    recipientEmail,
    emailStatus: 'simulated',
    emailAttemptedAt: issuedAt,
    emailAttempts: 1,
  };
}
export function invoiceFilename(booking: DemoBooking) {
  return `invoice-booking-reservasi-${booking.id}.pdf`;
}
