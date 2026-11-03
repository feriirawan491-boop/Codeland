import { LOCATIONS } from '@/features/home/lib/search';

export type DemoLocationId = (typeof LOCATIONS)[number]['id'];

export const DEMO_LOCATION_DETAILS: Record<
  DemoLocationId,
  {
    area: string;
    coordinates: [number, number];
    zone: string;
    offset: number;
  }
> = {
  bali: {
    area: 'Kuta, Bali',
    coordinates: [-8.65, 115.22],
    zone: 'Asia/Makassar',
    offset: 8,
  },
  yogyakarta: {
    area: 'Pusat kota, Yogyakarta',
    coordinates: [-7.795, 110.369],
    zone: 'Asia/Jakarta',
    offset: 7,
  },
  jakarta: {
    area: 'Menteng, Jakarta',
    coordinates: [-6.195, 106.84],
    zone: 'Asia/Jakarta',
    offset: 7,
  },
  bandung: {
    area: 'Lembang, Bandung',
    coordinates: [-6.815, 107.62],
    zone: 'Asia/Jakarta',
    offset: 7,
  },
  lombok: {
    area: 'Senggigi, Lombok',
    coordinates: [-8.49, 116.05],
    zone: 'Asia/Makassar',
    offset: 8,
  },
  surabaya: {
    area: 'Pusat kota, Surabaya',
    coordinates: [-7.265, 112.742],
    zone: 'Asia/Jakarta',
    offset: 7,
  },
  ubud: {
    area: 'Ubud, Bali',
    coordinates: [-8.506, 115.262],
    zone: 'Asia/Makassar',
    offset: 8,
  },
};

export const DEMO_MIN_LISTINGS_PER_LOCATION = 5;

export function demoLocationDetails(id: string) {
  const details = DEMO_LOCATION_DETAILS[id as DemoLocationId];
  if (!details) throw new Error(`Unknown demo location: ${id}.`);
  return details;
}
