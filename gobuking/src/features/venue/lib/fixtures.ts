import { publicVenues } from '@/features/catalog/lib/runtime';
import type { Venue, VenueSpace, VenuePackage } from './types';
import { datePlus } from '@/features/hotel/lib/query';
function packages(id: string, index: number): VenuePackage[] {
  return [
    {
      id: `${id}-full`,
      name: 'Full Day Meeting',
      basis: 'participant',
      amount: 185000 + index * 15000,
      minParticipants: 50,
      durationHours: 8,
      includes: [
        'Pemakaian ruang 8 jam',
        '2 kali coffee break',
        'Makan siang',
        'Air mineral',
      ],
      excludes: ['Akomodasi kamar', 'Dekorasi khusus'],
      taxPercent: 11,
      servicePercent: 5,
    },
    {
      id: `${id}-hour`,
      name: 'Ruang Fleksibel',
      basis: 'hour',
      amount: 650000 + index * 50000,
      minParticipants: 1,
      durationHours: 4,
      includes: ['Pemakaian ruang', 'Air mineral'],
      excludes: ['Katering', 'Akomodasi kamar'],
      taxPercent: 11,
      servicePercent: 5,
    },
    {
      id: `${id}-day`,
      name: 'Venue Harian',
      basis: 'day',
      amount: 5500000 + index * 350000,
      minParticipants: 1,
      durationHours: 10,
      includes: ['Pemakaian ruang 10 jam', 'Penataan dasar'],
      excludes: ['Katering', 'Dekorasi khusus'],
      taxPercent: 11,
      servicePercent: 5,
    },
    {
      id: `${id}-custom`,
      name: 'Paket Disesuaikan',
      basis: 'quote',
      amount: null,
      minParticipants: 1,
      durationHours: 8,
      includes: ['Kebutuhan dibahas bersama PIC'],
      excludes: ['Harga final mengikuti penawaran'],
      taxPercent: 11,
      servicePercent: 5,
    },
  ];
}
function space(
  id: string,
  name: string,
  theater: number,
  classroom: number,
  index: number,
  options: Partial<VenueSpace> = {},
): VenueSpace {
  return {
    id,
    slug: id,
    venueId: '',
    name,
    area: Math.round(theater * 1.3),
    setting: 'indoor',
    capacity: {
      theater,
      classroom,
      boardroom: Math.min(40, Math.floor(theater / 3)),
      ushape: Math.floor(theater * 0.4),
      banquet: Math.floor(theater * 0.6),
      standing: Math.floor(theater * 1.3),
    },
    facilities: {
      av: index % 4 === 2 ? null : true,
      wifi: true,
      parking: true,
      catering: index % 3 !== 2,
      accessible: index % 4 !== 3,
    },
    images:
      options.setting === 'outdoor'
        ? ['hotel', 'mice-conference', 'venue']
        : theater >= 220
          ? ['venue', 'mice-conference', 'mice-meeting']
          : theater >= 80
            ? ['mice-conference', 'mice-meeting', 'venue']
            : ['mice-boardroom', 'mice-meeting', 'mice-conference'],
    packages: packages(id, index),
    rules: [
      'Jam persiapan dan pembongkaran harus disepakati dengan PIC.',
      'Kapasitas mengikuti tata ruang yang dipilih.',
      'Vendor eksternal dan biaya tambahan perlu konfirmasi tertulis.',
    ],
    resourceId: `venue:${id}`,
    services: ['mice', 'wedding'],
    active: true,
    blocks: [
      {
        start: `${datePlus(20)}T09:00:00`,
        end: `${datePlus(20)}T18:00:00`,
        source: 'wedding',
      },
    ],
    ...options,
  };
}
const definitions: [string, string, string, string, VenueSpace[]][] = [
  [
    'meridian',
    'Meridian Convention Jakarta',
    'jakarta',
    'Kuningan, Jakarta',
    [
      space('cendana-hall', 'Cendana Hall', 150, 80, 0),
      space('angsana-ballroom', 'Angsana Ballroom', 320, 200, 1),
      space('meranti-boardroom', 'Meranti Boardroom', 24, 18, 2),
    ],
  ],
  [
    'nusa-hub',
    'Nusa Business Hub',
    'jakarta',
    'Menteng, Jakarta',
    [
      space('cakrawala-room', 'Cakrawala Room', 120, 90, 3),
      space('nusantara-hall', 'Nusantara Hall', 200, 140, 4),
    ],
  ],
  [
    'santara',
    'Santara Convention',
    'jakarta',
    'Senayan, Jakarta',
    [
      space('santara-a', 'Santara A', 100, 60, 5),
      space('santara-b', 'Santara B', 180, 110, 6),
      space('santara-garden', 'Santara Garden', 200, 80, 7, {
        setting: 'outdoor',
        capacity: {
          theater: 200,
          classroom: 80,
          boardroom: null,
          ushape: null,
          banquet: 150,
          standing: 300,
        },
      }),
    ],
  ],
  [
    'arunika',
    'Arunika Event Center',
    'jakarta',
    'Kemayoran, Jakarta',
    [
      space('arunika-main', 'Arunika Main Hall', 240, 150, 8),
      space('arunika-studio', 'Arunika Studio', 90, 70, 9),
    ],
  ],
  [
    'amara',
    'Amara Garden Venue',
    'bandung',
    'Lembang, Bandung',
    [
      space('amara-ballroom', 'Amara Ballroom', 250, 160, 2),
      space('amara-meeting', 'Amara Meeting Room', 80, 50, 1),
    ],
  ],
  [
    'bali-nusa',
    'Bali Nusa Conference',
    'bali',
    'Nusa Dua, Bali',
    [
      space('bali-nusa-hall', 'Nusa Hall', 350, 220, 4),
      space('bali-samudra', 'Samudra Meeting Room', 100, 70, 3),
      space('bali-garden', 'Nusa Garden', 160, 60, 2, { setting: 'outdoor' }),
    ],
  ],
  [
    'sekar',
    'Sekar Convention Yogyakarta',
    'yogyakarta',
    'Pusat kota, Yogyakarta',
    [space('sekar-room', 'Sekar Meeting Room', 140, 90, 2)],
  ],
  [
    'juanda',
    'Juanda Business Center',
    'surabaya',
    'Pusat kota, Surabaya',
    [space('juanda-hall', 'Juanda Conference Hall', 200, 120, 3)],
  ],
];
export const VENUE_FIXTURES: Venue[] = definitions.map(
  ([id, name, locationId, area, spaces]) => ({
    id,
    name,
    locationId,
    area,
    zone: locationId === 'bali' ? 'Asia/Makassar' : 'Asia/Jakarta',
    offset: locationId === 'bali' ? 8 : 7,
    description:
      'Ruang untuk bertemu, berbagi ide, dan merencanakan langkah berikutnya. Pilih ruang serta paket sesuai kebutuhan acara Anda.',
    pic: { name: 'Tim Venue Sales Demo', team: name },
    spaces: spaces.map((s) => ({ ...s, venueId: id })),
  }),
);
export function findFixtureSpace(id: string) {
  for (const venue of publicVenues()) {
    const space = venue.spaces.find((s) => s.id === id || s.slug === id);
    if (space) return { venue, space };
  }
  return null;
}
