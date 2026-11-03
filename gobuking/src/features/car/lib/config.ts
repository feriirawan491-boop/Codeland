import type { CarBookingStatus, CarClass, CarScenario } from './types';
export const CAR_AREAS = {
  central: 'Pusat kota',
  airport: 'Bandara',
  station: 'Stasiun',
} as const;
export const CAR_CLASSES: Record<CarClass, string> = {
  city: 'City car',
  mpv: 'MPV',
  suv: 'SUV',
  van: 'Minibus',
};
export const CAR_STATUSES: Record<CarBookingStatus, string> = {
  requested: 'Menunggu verifikasi mitra',
  rejected: 'Permintaan ditolak',
  awaiting_payment: 'Disetujui · Menunggu pembayaran',
  confirmed: 'Reservasi rental terkonfirmasi',
  expired: 'Batas pembayaran berakhir',
  in_use: 'Kendaraan sedang digunakan',
  completed: 'Rental selesai',
  cancelled: 'Permintaan dibatalkan',
  exception: 'Perlu pemeriksaan pembayaran',
};
export const CAR_SCENARIOS: CarScenario[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'timeout',
  'rate_limited',
  'inactive',
  'maintenance',
  'driver_busy',
  'price_changed',
  'quote_expired',
  'mutation_timeout',
  'unauthorized',
  'forbidden',
];
export const CAR_ZONE = (city: string) =>
  city === 'bali' || city === 'lombok' ? 'Asia/Makassar' : 'Asia/Jakarta';
export const CAR_OFFSET = (city: string) =>
  city === 'bali' || city === 'lombok' ? 8 : 7;

export const CAR_PROVIDERS = {
  nusantara: 'Nusantara Mobility',
  jelajah: 'Jelajah Rental',
  mandiri: 'Mandiri Drive',
} as const;

export function carAreaLabel(area: string) {
  return Object.hasOwn(CAR_AREAS, area)
    ? CAR_AREAS[area as keyof typeof CAR_AREAS]
    : 'Area belum dipilih';
}
