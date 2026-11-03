import { publicVenues } from '@/features/catalog/lib/runtime';
import { findFixtureSpace } from './fixtures';
import type { Venue, VenuePackage, VenueSpace } from './types';
import type { WeddingSpace } from './wedding-types';
function packages(space: VenueSpace, index: number): VenuePackage[] {
  const minimum = Math.min(
    100,
    Math.max(30, Math.floor((space.capacity.banquet ?? 100) / 2)),
  );
  return [
    {
      id: `${space.id}-wedding-venue`,
      name: 'Venue Only',
      basis: 'event',
      amount: 15000000 + index * 1500000,
      minParticipants: 1,
      durationHours: 8,
      includes: [
        'Sewa area acara 8 jam',
        'Penataan meja dan kursi dasar',
        'Area persiapan keluarga',
      ],
      excludes: ['Katering', 'Dekorasi', 'Wedding organizer', 'Dokumentasi'],
      taxPercent: 11,
      servicePercent: 5,
      wedding: {
        kind: 'venue-only',
        catering: false,
        decoration: false,
        overtime: 1500000,
        overtimePolicy:
          'Overtime perlu persetujuan PIC dan tidak boleh melewati batas jam venue.',
      },
    },
    {
      id: `${space.id}-wedding-intimate`,
      name: 'Intimate Celebration',
      basis: 'participant',
      amount: 425000 + index * 25000,
      minParticipants: minimum,
      durationHours: 6,
      includes: [
        'Sewa area acara 6 jam',
        'Katering menu standar',
        'Dekorasi dasar',
        'Penataan meja dan kursi',
      ],
      excludes: ['Wedding organizer', 'Dokumentasi', 'Dekorasi khusus'],
      taxPercent: 11,
      servicePercent: 5,
      wedding: {
        kind: 'inclusive',
        catering: true,
        decoration: true,
        overtime: 1750000,
        overtimePolicy:
          'Ketersediaan overtime dan tambahan menu dikonfirmasi melalui penawaran.',
      },
    },
    {
      id: `${space.id}-wedding-custom`,
      name: 'Your Wedding, Your Way',
      basis: 'quote',
      amount: null,
      minParticipants: 1,
      durationHours: 8,
      includes: ['Kebutuhan disusun bersama PIC'],
      excludes: ['Isi paket mengikuti penawaran tertulis'],
      taxPercent: 11,
      servicePercent: 5,
      wedding: {
        kind: 'inclusive',
        catering: null,
        decoration: null,
        overtime: null,
        overtimePolicy:
          'Tarif overtime belum tersedia; minta rincian tertulis dari PIC.',
      },
    },
  ];
}
const base = findFixtureSpace('angsana-ballroom')!;
const estate: Venue = {
  id: 'asmara-estate',
  name: 'Asmara Celebration Estate',
  locationId: 'jakarta',
  area: 'Jakarta Selatan, Jakarta',
  zone: 'Asia/Jakarta',
  offset: 7,
  description:
    'Area perayaan untuk momen yang ingin Anda kenang bersama orang terdekat.',
  pic: { name: 'Wedding Sales Demo', team: 'Asmara Celebration Estate' },
  spaces: [
    {
      ...structuredClone(base.space),
      id: 'asmara-grand',
      slug: 'asmara-grand',
      venueId: 'asmara-estate',
      name: 'Asmara Grand Ballroom',
      area: 1100,
      capacity: { ...base.space.capacity, banquet: 650, standing: 900 },
      resourceId: 'venue:asmara-grand',
      services: ['wedding'],
      blocks: [],
    },
    {
      ...structuredClone(base.space),
      id: 'asmara-garden',
      slug: 'asmara-garden',
      venueId: 'asmara-estate',
      name: 'Asmara Garden',
      area: 850,
      setting: 'outdoor',
      capacity: {
        theater: 500,
        classroom: null,
        boardroom: null,
        ushape: null,
        banquet: 320,
        standing: 500,
      },
      resourceId: 'venue:asmara-garden',
      services: ['wedding'],
      blocks: [],
    },
  ],
};
const catalogVenues = () => [...publicVenues(), estate];
export function weddingCatalog(): WeddingSpace[] {
  return catalogVenues().flatMap((venue) =>
    venue.spaces
      .filter(
        (space) =>
          space.services.includes('wedding') &&
          (space.capacity.banquet ?? 0) >= 80,
      )
      .map((original, index) => {
        const outdoor = original.setting === 'outdoor';
        const primary = outdoor ? 'wedding-outdoor' : 'venue';
        const space = {
          ...structuredClone(original),
          packages: packages(original, index),
          images: [primary, 'wedding-celebration', 'wedding-garden'],
        };
        return {
          venue: { ...structuredClone(venue), spaces: [] },
          space,
          kind: outdoor
            ? ('garden' as const)
            : venue.locationId === 'bali'
              ? ('resort' as const)
              : original.capacity.banquet! >= 150
                ? ('ballroom' as const)
                : ('hall' as const),
          seated: space.capacity.banquet,
          standing: space.capacity.standing,
          openTime: '08:00',
          closeTime: '22:00',
          musicUntil: '21:00',
          access:
            space.facilities.accessible === true
              ? 'Akses kursi roda tersedia. Detail rute kedatangan dikonfirmasi dengan PIC.'
              : 'Akses khusus tamu perlu dikonfirmasi dengan PIC.',
          parking:
            'Parkir tersedia. Kuota dan pengaturan kendaraan perlu dikonfirmasi.',
          photos: [
            { image: primary, area: 'Area acara' },
            {
              image: 'wedding-celebration',
              area: 'Ilustrasi penataan',
            },
            {
              image: 'wedding-garden',
              area: 'Inspirasi seremoni',
            },
          ],
        };
      }),
  );
}
export function weddingSpace(id: string) {
  return (
    weddingCatalog().find(
      (value) => value.space.id === id || value.space.slug === id,
    ) ?? null
  );
}
