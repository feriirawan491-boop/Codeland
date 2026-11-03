import type { BookingStatus, PaymentStatus, RefundStatus } from './types';
export const BOOKING_LABELS: Record<BookingStatus, string> = {
  awaiting_payment: 'Menunggu pembayaran',
  confirmed: 'Reservasi demo terkonfirmasi',
  expired: 'Pesanan kedaluwarsa',
  cancelled: 'Pesanan dibatalkan',
  exception: 'Reservasi sedang ditangani',
  completed: 'Layanan demo selesai',
};
export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  not_started: 'Belum ada pembayaran',
  pending: 'Pembayaran sedang diperiksa',
  succeeded: 'Pembayaran demo diterima',
  failed: 'Pembayaran gagal',
  expired: 'Tagihan kedaluwarsa',
};
export const REFUND_LABELS: Record<RefundStatus, string> = {
  none: 'Tidak ada refund',
  requested: 'Refund diminta',
  processing: 'Pengembalian dana diproses',
  succeeded: 'Pengembalian dana demo selesai',
};
