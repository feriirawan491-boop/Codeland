import { HOTEL_FIXTURES } from '@/features/hotel/lib/fixtures';
import { HOME_FIXTURES } from '@/features/home-rental/lib/fixtures';
import { CAR_OFFERS } from '@/features/car/lib/fixtures';
import { venueAdapter } from '@/features/venue/lib/adapter';
import type { PartnerListing } from './types';
export function demoPartnerListings(
  stayOrg: string,
  carOrg: string,
): PartnerListing[] {
  const base = {
    address: 'Alamat operasional sesuai katalog demo',
    description:
      'Properti contoh dari katalog Gobuking. Perubahan material memerlukan review platform.',
    facilities: ['Wi-Fi', 'Area parkir'],
    buffer: 0,
    minStay: 1,
    ratePlan: 'Tarif standar',
    status: 'published' as const,
    version: 1,
  };
  const hotel = HOTEL_FIXTURES.find((v) => v.id === 'seruni')!,
    home = HOME_FIXTURES.find((v) => v.id === 'nala')!;
  const rows: PartnerListing[] = [
    ...hotel.rooms.map((room) => ({
      ...base,
      id:
        room.id === 'deluxe'
          ? 'PTR-HOTEL-SERUNI'
          : `PTR-HOTEL-SERUNI-${room.id}`,
      orgId: stayOrg,
      category: 'hotel' as const,
      sourceId: hotel.id,
      name: `${hotel.name} · ${room.name}`,
      liveName: hotel.name,
      resourceId: room.resourceId,
      stock: room.stock,
      price: room.rates[0].nightly,
      capacity: room.capacity,
      image: hotel.images[0],
      zone: hotel.zone,
      publicPath: `/hotels/${hotel.slug}`,
    })),
    {
      ...base,
      id: 'PTR-HOME-NALA',
      orgId: stayOrg,
      category: 'home',
      sourceId: home.id,
      name: home.name,
      liveName: home.name,
      resourceId: home.resourceId,
      stock: 1,
      price: home.nightly,
      capacity: home.maxGuests,
      image: home.images[0],
      buffer: home.bufferNights,
      zone: home.zone,
      publicPath: `/homes/${home.slug}`,
    },
  ];
  for (const [id, category] of [
    ['cendana-hall', 'mice'],
    ['amara-ballroom', 'wedding'],
  ] as const) {
    const { space, venue } = venueAdapter.getSpaceById(id, category)!;
    rows.push({
      ...base,
      id: `PTR-${id}`,
      orgId: stayOrg,
      category,
      sourceId: id,
      name: space.name,
      liveName: space.name,
      resourceId: space.resourceId,
      stock: 1,
      price: 5000000,
      capacity: space.capacity.theater ?? space.capacity.banquet ?? 100,
      image: space.images[0],
      zone: venue.zone,
      publicPath: `/${category}/${space.slug}`,
    });
  }
  for (const offer of CAR_OFFERS.filter(
    (o) => o.id === 'jakarta-mpv-driver' || o.id === 'jakarta-mpv-self',
  ))
    rows.push({
      ...base,
      id: `PTR-${offer.id}`,
      orgId: carOrg,
      category: 'car',
      sourceId: offer.id,
      name: offer.name,
      liveName: offer.name,
      resourceId: `car:${offer.id}`,
      stock: 2,
      price: 480000,
      capacity: 7,
      image: offer.image,
      zone: 'Asia/Jakarta',
      buffer: offer.bufferMinutes,
      publicPath: `/cars/${offer.id}`,
    });
  return rows;
}
