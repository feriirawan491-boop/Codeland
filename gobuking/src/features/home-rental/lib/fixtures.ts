import { datePlus } from '@/features/hotel/lib/query';
import {
  demoLocationDetails,
  DEMO_MIN_LISTINGS_PER_LOCATION,
} from '@/features/catalog/lib/demo-locations';
import { LOCATIONS } from '@/features/home/lib/search';
import type { HomeProperty, HomeType, HomeAmenity } from './types';
const definitions: {
  id: string;
  slug: string;
  name: string;
  locationId: string;
  area: string;
  type: HomeType;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  price: number;
  score: number | null;
  image: string;
  amenities: HomeAmenity[];
  pets?: boolean;
  coordinates: [number, number];
}[] = [
  {
    id: 'nala',
    slug: 'villa-nala-ubud',
    name: 'Villa Nala Ubud',
    locationId: 'bali',
    area: 'Ubud, Bali',
    type: 'villa',
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    maxGuests: 4,
    price: 1850000,
    score: 9.6,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'pool', 'parking', 'air', 'garden'],
    coordinates: [-8.49, 115.27],
  },
  {
    id: 'sora',
    slug: 'sora-canggu-house',
    name: 'Sora Canggu House',
    locationId: 'bali',
    area: 'Canggu, Bali',
    type: 'house',
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    maxGuests: 6,
    price: 2100000,
    score: 9.3,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'parking', 'air', 'washer', 'workspace'],
    pets: true,
    coordinates: [-8.635, 115.145],
  },
  {
    id: 'ayu',
    slug: 'ayu-sanur-residence',
    name: 'Ayu Sanur Residence',
    locationId: 'bali',
    area: 'Sanur, Bali',
    type: 'apartment',
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    maxGuests: 3,
    price: 775000,
    score: 8.9,
    image: 'room',
    amenities: ['wifi', 'kitchen', 'air', 'workspace'],
    coordinates: [-8.695, 115.252],
  },
  {
    id: 'padi',
    slug: 'padi-ubud-villa',
    name: 'Padi Ubud Villa',
    locationId: 'bali',
    area: 'Ubud, Bali',
    type: 'villa',
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    maxGuests: 6,
    price: 2450000,
    score: 9.5,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'pool', 'parking', 'air', 'garden'],
    pets: true,
    coordinates: [-8.47, 115.26],
  },
  {
    id: 'tala',
    slug: 'tala-seminyak-villa',
    name: 'Tala Seminyak Villa',
    locationId: 'bali',
    area: 'Seminyak, Bali',
    type: 'villa',
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    maxGuests: 5,
    price: 1690000,
    score: 9.1,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'pool', 'air', 'washer'],
    coordinates: [-8.68, 115.167],
  },
  {
    id: 'mira',
    slug: 'mira-jimbaran-house',
    name: 'Mira Jimbaran House',
    locationId: 'bali',
    area: 'Jimbaran, Bali',
    type: 'house',
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    maxGuests: 8,
    price: 2890000,
    score: 9.2,
    image: 'hotel',
    amenities: ['wifi', 'kitchen', 'pool', 'parking', 'air', 'garden'],
    coordinates: [-8.795, 115.165],
  },
  {
    id: 'luma',
    slug: 'luma-legian-apartment',
    name: 'Luma Legian Apartment',
    locationId: 'bali',
    area: 'Legian, Bali',
    type: 'apartment',
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 2,
    price: 595000,
    score: null,
    image: 'room',
    amenities: ['wifi', 'kitchen', 'air'],
    coordinates: [-8.708, 115.174],
  },
  {
    id: 'seruni-residence',
    slug: 'seruni-garden-residence',
    name: 'Seruni Garden Residence',
    locationId: 'bali',
    area: 'Ubud, Bali',
    type: 'apartment',
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    maxGuests: 4,
    price: 1937500,
    score: 9.2,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'pool', 'parking', 'air', 'garden'],
    coordinates: [-8.505, 115.26],
  },
  {
    id: 'ranu',
    slug: 'ranu-lembang-house',
    name: 'Ranu Lembang House',
    locationId: 'bandung',
    area: 'Lembang, Bandung',
    type: 'house',
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    maxGuests: 6,
    price: 1375000,
    score: 9.4,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'parking', 'washer', 'garden'],
    pets: true,
    coordinates: [-6.815, 107.62],
  },
  {
    id: 'sekar',
    slug: 'sekar-yogyakarta-home',
    name: 'Sekar Yogyakarta Home',
    locationId: 'yogyakarta',
    area: 'Prawirotaman, Yogyakarta',
    type: 'house',
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    maxGuests: 5,
    price: 865000,
    score: 9.1,
    image: 'room',
    amenities: ['wifi', 'kitchen', 'parking', 'air'],
    coordinates: [-7.819, 110.369],
  },
  {
    id: 'nira',
    slug: 'nira-lombok-villa',
    name: 'Nira Lombok Villa',
    locationId: 'lombok',
    area: 'Senggigi, Lombok',
    type: 'villa',
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    maxGuests: 4,
    price: 1540000,
    score: 9.3,
    image: 'villa',
    amenities: ['wifi', 'kitchen', 'pool', 'parking', 'air', 'garden'],
    coordinates: [-8.49, 116.05],
  },
  {
    id: 'urban',
    slug: 'urban-menteng-apartment',
    name: 'Urban Menteng Apartment',
    locationId: 'jakarta',
    area: 'Menteng, Jakarta',
    type: 'apartment',
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    maxGuests: 4,
    price: 1100000,
    score: 8.8,
    image: 'room',
    amenities: ['wifi', 'kitchen', 'parking', 'air', 'washer', 'workspace'],
    coordinates: [-6.195, 106.84],
  },
];
// Public data contains approximate areas only. No street address, access code or private arrival data.
export const HOME_FIXTURES: HomeProperty[] = (() => {
  const rows: HomeProperty[] = definitions.map((home, index) => ({
    ...home,
    privacy: 'entire-unit',
    size: home.bedrooms * 42 + 24,
    images: [
      home.image,
      'room',
      'villa',
      home.locationId === 'bali' ? 'bali' : home.locationId,
    ],
    description:
      'Nikmati ruang sendiri untuk beristirahat, memasak, dan menghabiskan waktu bersama orang terdekat. Seluruh hunian disewakan untuk satu rombongan.',
    sleeping: Array.from({ length: home.bedrooms }, (_, i) => ({
      name: `Kamar tidur ${i + 1}`,
      description: i === 0 ? '1 tempat tidur king' : '1 tempat tidur double',
    })).concat(
      home.beds > home.bedrooms
        ? [{ name: 'Area tambahan', description: 'Sofa bed untuk 2 tamu' }]
        : [],
    ),
    host: {
      name: ['Nala Living', 'Ruang Bersama', 'Sahaja Stay'][index % 3],
      verification: index % 4 === 0 ? 'demo-reviewed' : 'not-reviewed',
      response: 'Respons pada jam operasional pengelola',
    },
    rules: {
      pets: home.pets ?? false,
      smoking: false,
      events: false,
      quietHours: '22:00–07:00',
      minimumAge: 18,
    },
    checkIn: '15:00',
    checkOut: '11:00',
    zone: demoLocationDetails(home.locationId).zone,
    minNights: index % 4 === 0 ? 2 : 1,
    maxNights: 30,
    leadDays: 1,
    bufferNights: home.id === 'seruni-residence' ? 0 : 1,
    nightly: home.price,
    cleaningFee: home.bedrooms * 75000,
    serviceFee: 45000,
    taxPercent: 11,
    deposit: {
      amount: home.type === 'apartment' ? 500000 : 1000000,
      recipient: ['Nala Living', 'Ruang Bersama', 'Sahaja Stay'][index % 3],
      policy:
        'Deposit dibayar kepada pengelola saat kedatangan dan dikembalikan setelah pemeriksaan hunian, sesuai aturan yang disepakati.',
    },
    extras: [
      {
        id: 'extra-cleaning',
        label: 'Pembersihan tambahan',
        amount: 150000,
        basis: 'stay',
      },
    ],
    freeCancellation: index % 3 !== 1,
    score: home.score,
    reviews:
      home.score === null
        ? []
        : [
            {
              id: 'hr1',
              author: 'Nadia A.',
              score: home.score,
              date: '2026-10-15',
              title: 'Hunian nyaman untuk bersama keluarga',
              body: 'Ruangnya sesuai kebutuhan rombongan, dapur membantu, dan informasi aturan rumah mudah dipahami.',
              trip: 'Perjalanan bersama keluarga',
            },
            {
              id: 'hr2',
              author: 'Aditya P.',
              score: home.score,
              date: '2026-10-09',
              title: 'Ruang sendiri untuk beristirahat',
              body: 'Proses kedatangan terarah dan fasilitas sesuai informasi yang ditampilkan.',
              trip: 'Perjalanan liburan',
            },
          ],
    ownerBlocks: [{ start: datePlus(13), end: datePlus(15) }],
    resourceId:
      home.id === 'seruni-residence' ? 'seruni:suite' : `home:${home.id}`,
    active: true,
  }));

  for (const location of LOCATIONS) {
    const details = demoLocationDetails(location.id);
    const matchesLocation = (home: HomeProperty) =>
      location.id === 'ubud'
        ? home.area === details.area
        : home.locationId === location.id;
    let count = rows.filter(matchesLocation).length;
    while (count < DEMO_MIN_LISTINGS_PER_LOCATION) {
      const template = rows.find(matchesLocation) ?? rows[0];
      if (!template)
        throw new Error(
          `Missing home rental demo template for ${location.id}.`,
        );
      const id = `${location.id}-home-demo-${count + 1}`;
      const home = structuredClone(template);
      home.id = id;
      home.slug = id;
      home.name = `${location.label} ${['Garden Villa', 'Family House', 'City Residence', 'Comfort Home', 'Vista Stay'][count]}`;
      home.locationId = location.id;
      home.area = details.area;
      home.coordinates = [...details.coordinates];
      home.zone = details.zone;
      home.host.name = `${location.label} Living`;
      home.deposit.recipient = home.host.name;
      home.ownerBlocks = [];
      home.resourceId = `home:${id}`;
      rows.push(home);
      count += 1;
    }
  }

  return rows;
})();
