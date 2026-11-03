import { hotelAdapter } from '@/features/hotel/lib/adapter';
import type { DemoBooking } from '@/features/hotel/lib/types';
export type ReservationPresentation = {
  name: string;
  address: string;
  zone: string;
  selectionLabel: string;
  rateLabel: string;
  path: string;
  categoryLabel: string;
  kind: 'home' | 'hotel';
};
export function bookingPresentation(
  booking: DemoBooking,
): ReservationPresentation | null {
  if (booking.staySnapshot) return structuredClone(booking.staySnapshot);
  if (booking.home)
    return {
      name: booking.home.name,
      address: booking.home.area,
      zone: booking.home.zone,
      selectionLabel: 'Seluruh hunian',
      rateLabel: 'Satu unit penuh',
      path: '/homes',
      categoryLabel: 'Home Rental',
      kind: 'home',
    };
  const hotel = hotelAdapter.getHotelById(booking.quote.propertyId);
  if (!hotel) return null;
  const room = hotel.rooms.find(
    (room) => room.id === booking.quote.selectionId,
  );
  return {
    name: hotel.name,
    address: hotel.address,
    zone: hotel.zone,
    selectionLabel: room?.name ?? '',
    rateLabel:
      room?.rates.find((rate) => rate.id === booking.quote.rateId)?.label ?? '',
    path: '/hotels',
    categoryLabel: 'Hotel',
    kind: 'hotel',
  };
}
