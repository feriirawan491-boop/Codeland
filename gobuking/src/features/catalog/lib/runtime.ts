import { HOTEL_FIXTURES } from '@/features/hotel/lib/fixtures';
import { HOME_FIXTURES } from '@/features/home-rental/lib/fixtures';
import { CAR_OFFERS } from '@/features/car/lib/fixtures';
import { VENUE_FIXTURES } from '@/features/venue/lib/fixtures';
import { approvedCatalog } from './public-state';
import type { Hotel } from '@/features/hotel/lib/types';
import type { HomeProperty } from '@/features/home-rental/lib/types';
import type { CarOffer } from '@/features/car/lib/types';
import type { Venue } from '@/features/venue/lib/types';
export function publicHotels(): Hotel[] {
  const rows = structuredClone(HOTEL_FIXTURES);
  for (const p of approvedCatalog().filter((v) => v.category === 'hotel')) {
    let h = rows.find((v) => v.id === p.sourceId);
    if (!h) {
      h = {
        ...structuredClone(HOTEL_FIXTURES[0]),
        id: p.sourceId,
        slug: p.slug,
        reviews: [],
        score: null,
        rooms: [
          {
            ...structuredClone(HOTEL_FIXTURES[0].rooms[0]),
            resourceId: p.resourceId,
          },
        ],
      };
      rows.push(h);
    }
    Object.assign(h, {
      name: p.name,
      address: p.address,
      description: p.description,
      images: [p.image],
      locationId: p.locationId,
      area: p.address,
      zone: p.zone,
    });
    const room =
      h.rooms.find((r) => r.resourceId === p.resourceId) ?? h.rooms[0];
    Object.assign(room, {
      resourceId: p.resourceId,
      capacity: p.capacity,
      stock: p.stock,
      image: p.image,
    });
    room.rates = room.rates.map((r) => ({ ...r, nightly: p.price }));
  }
  return rows;
}
export function publicHomes(): HomeProperty[] {
  const rows = structuredClone(HOME_FIXTURES);
  for (const p of approvedCatalog().filter((v) => v.category === 'home')) {
    let h = rows.find((v) => v.id === p.sourceId);
    if (!h) {
      h = {
        ...structuredClone(HOME_FIXTURES[0]),
        id: p.sourceId,
        slug: p.slug,
        reviews: [],
        score: null,
        ownerBlocks: [],
      };
      rows.push(h);
    }
    Object.assign(h, {
      resourceId: p.resourceId,
      name: p.name,
      description: p.description,
      images: [p.image],
      locationId: p.locationId,
      area: p.address,
      zone: p.zone,
      maxGuests: p.capacity,
      nightly: p.price,
      minNights: p.minStay,
      bufferNights: p.buffer,
      active: true,
    });
  }
  return rows;
}
export function publicCars(): CarOffer[] {
  const rows = structuredClone(CAR_OFFERS);
  for (const p of approvedCatalog().filter((v) => v.category === 'car')) {
    let c = rows.find((v) => v.id === p.sourceId);
    if (!c) {
      c = {
        ...structuredClone(
          CAR_OFFERS.find(
            (v) => v.locationId === p.locationId && v.mode === 'self',
          ) ?? CAR_OFFERS[0],
        ),
        id: p.sourceId,
        providerId: p.orgId + ':' + p.resourceId,
        providerName: p.name,
      };
      rows.push(c);
    }
    Object.assign(c, {
      name: p.name,
      image: p.image,
      locationId: p.locationId,
      rate: p.price,
      seats: p.capacity,
      bufferMinutes: p.buffer,
      active: true,
    });
  }
  return rows;
}
export function publicCarFixture(id: string) {
  return publicCars().find((v) => v.id === id) ?? null;
}
export function publicVenues(): Venue[] {
  const rows = structuredClone(VENUE_FIXTURES);
  for (const p of approvedCatalog().filter(
    (v) => v.category === 'mice' || v.category === 'wedding',
  )) {
    let venue = rows.find((v) => v.spaces.some((s) => s.id === p.sourceId));
    if (!venue) {
      const base = structuredClone(VENUE_FIXTURES[0]);
      venue = {
        ...base,
        id: p.orgId + ':' + p.sourceId,
        name: p.name,
        spaces: [
          {
            ...base.spaces[0],
            id: p.sourceId,
            slug: p.slug,
            venueId: p.orgId + ':' + p.sourceId,
            resourceId: p.resourceId,
            services: [p.category as 'mice' | 'wedding'],
            blocks: [],
            packages: base.spaces[0].packages.map((pack, i) => ({
              ...pack,
              id: `${p.sourceId}-package-${i}`,
              basis: 'quote' as const,
              amount: null,
            })),
          },
        ],
      };
      rows.push(venue);
    }
    Object.assign(venue, {
      locationId: p.locationId,
      zone: p.zone,
      offset:
        p.zone === 'Asia/Makassar' ? 8 : p.zone === 'Asia/Jayapura' ? 9 : 7,
      area: p.address,
    });
    const space = venue.spaces.find((v) => v.id === p.sourceId)!;
    Object.assign(space, {
      name: p.name,
      resourceId: p.resourceId,
      images: [p.image],
      rules: [p.description],
      active: true,
    });
    space.capacity = Object.fromEntries(
      Object.keys(space.capacity).map((key) => [key, p.capacity]),
    ) as typeof space.capacity;
  }
  return rows;
}
