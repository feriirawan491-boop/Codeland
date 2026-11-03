export type Destination = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  className?: string;
};
export const DESTINATIONS: Destination[] = [
  {
    id: 'bali',
    name: 'Bali',
    subtitle: 'Temukan ritme pulau dewata',
    image: 'bali',
    className: 'destination-wide',
  },
  {
    id: 'yogyakarta',
    name: 'Yogyakarta',
    subtitle: 'Budaya di setiap sudutnya',
    image: 'yogyakarta',
  },
  {
    id: 'jakarta',
    name: 'Jakarta',
    subtitle: 'Cerita di tengah kota',
    image: 'jakarta',
  },
  {
    id: 'lombok',
    name: 'Lombok',
    subtitle: 'Sejenak, kembali ke alam',
    image: 'lombok',
  },
  {
    id: 'bandung',
    name: 'Bandung',
    subtitle: 'Udara sejuk, suasana baru',
    image: 'bandung',
  },
];
export type Listing = {
  id: string;
  name: string;
  area: string;
  category: 'hotel' | 'home' | 'mice' | 'wedding';
  type: string;
  image: string;
  price: number;
  unit: string;
  features: string;
  published: boolean;
  hotelStars?: 1 | 2 | 3 | 4 | 5;
  review?: { score: number; count: number };
};
export const LISTINGS: Listing[] = [
  {
    id: 'seruni',
    hotelStars: 5,
    review: { score: 9.2, count: 128 },
    name: 'Seruni Resort & Spa',
    area: 'Ubud, Bali',
    category: 'hotel',
    type: 'Hotel & resort',
    image: 'hotel',
    price: 1250000,
    unit: 'malam',
    features: 'Kolam renang · Sarapan tersedia',
    published: true,
  },
  {
    id: 'nala',
    review: { score: 9.6, count: 84 },
    name: 'Villa Nala Ubud',
    area: 'Ubud, Bali',
    category: 'home',
    type: 'Seluruh hunian',
    image: 'villa',
    price: 1850000,
    unit: 'malam / unit',
    features: '2 kamar tidur · Maks. 4 tamu',
    published: true,
  },
  {
    id: 'artha',
    hotelStars: 3,
    review: { score: 8.8, count: 216 },
    name: 'Artha City Hotel',
    area: 'Pusat kota, Yogyakarta',
    category: 'hotel',
    type: 'Hotel',
    image: 'room',
    price: 625000,
    unit: 'malam',
    features: 'Wi-Fi · Dekat pusat kota',
    published: true,
  },
  {
    id: 'amara',
    review: { score: 9.4, count: 52 },
    name: 'Amara Garden Venue',
    area: 'Lembang, Bandung',
    category: 'wedding',
    type: 'Wedding venue',
    image: 'venue',
    price: 25000000,
    unit: 'sewa venue',
    features: 'Outdoor · Kapasitas duduk 200 tamu',
    published: true,
  },
];
export const DEALS = [
  {
    id: 'weekend',
    eyebrow: 'WAKTUNYA REHAT',
    title: 'Akhir pekan,\ncerita yang berbeda.',
    description: 'Contoh penawaran menginap untuk jeda yang Anda nantikan.',
    tag: 'Contoh diskon 15%',
    style: 'peach',
    service: 'hotel',
  },
  {
    id: 'together',
    eyebrow: 'LEBIH DEKAT BERSAMA',
    title: 'Satu hunian.\nBanyak kenangan.',
    description: 'Temukan inspirasi hunian untuk waktu berkualitas bersama.',
    tag: 'Inspirasi home rental',
    style: 'blue',
    service: 'home',
  },
] as const;
export type HomeContent = { destinations: Destination[]; listings: Listing[] };
export type Scenario = 'ready' | 'loading' | 'empty' | 'error';
export async function getHomepageContent(
  scenario: Scenario,
  signal?: AbortSignal,
): Promise<HomeContent> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, scenario === 'loading' ? 1800 : 250);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
  if (scenario === 'error') throw new Error('Konten belum dapat dimuat.');
  return scenario === 'empty'
    ? { destinations: [], listings: [] }
    : {
        destinations: DESTINATIONS,
        listings: LISTINGS.filter((l) => l.published),
      };
}
