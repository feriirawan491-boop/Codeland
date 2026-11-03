import { publicCarFixture } from '@/features/catalog/lib/runtime';
import { LOCATIONS } from '@/features/home/lib/search';
import type { CarOffer, CarClass, RentalMode } from './types';
const models: {
  id: string;
  vehicleClass: CarClass;
  name: string;
  seats: number;
  baggage: number | null;
  image: string;
  rate: number;
}[] = [
  {
    id: 'city',
    vehicleClass: 'city',
    name: 'City Compact',
    seats: 5,
    baggage: 2,
    image: 'car-city',
    rate: 300000,
  },
  {
    id: 'mpv',
    vehicleClass: 'mpv',
    name: 'Family MPV',
    seats: 7,
    baggage: 3,
    image: 'car-suv',
    rate: 480000,
  },
  {
    id: 'suv',
    vehicleClass: 'suv',
    name: 'Adventure SUV',
    seats: 5,
    baggage: 4,
    image: 'car-suv',
    rate: 650000,
  },
  {
    id: 'van',
    vehicleClass: 'van',
    name: 'Group Minibus',
    seats: 12,
    baggage: null,
    image: 'illustration-van',
    rate: 950000,
  },
  {
    id: 'mpv-premium',
    vehicleClass: 'mpv',
    name: 'Premium Family MPV',
    seats: 7,
    baggage: 3,
    image: 'car-suv',
    rate: 560000,
  },
];
export const CAR_OFFERS: CarOffer[] = LOCATIONS.flatMap((city) =>
  models.flatMap((model, i) =>
    (['driver', 'self'] as RentalMode[])
      .filter((mode) => !(model.vehicleClass === 'van' && mode === 'self'))
      .map((mode) => ({
        ...model,
        id: `${city.id}-${model.id}-${mode}`,
        locationId: city.id,
        transmission: i === 3 ? ('manual' as const) : ('automatic' as const),
        providerId: i % 2 === 0 ? 'nusantara' : 'jelajah',
        providerName: i % 2 === 0 ? 'Nusantara Mobility' : 'Jelajah Rental',
        mode,
        unitHours: mode === 'driver' ? 12 : 24,
        rate: model.rate + (mode === 'driver' ? 200000 : 0),
        taxPercent: 11,
        serviceFee: 25000,
        deliveryFee: 75000,
        deposit: mode === 'self' ? 1500000 : 0,
        minAge: mode === 'self' ? 21 : 18,
        leadHours: mode === 'self' ? 24 : 4,
        uploadRequired: model.vehicleClass === 'suv' && mode === 'self',
        bufferMinutes: 60,
        areas: ['central', 'airport', 'station'],
        fuel: mode === 'driver',
        toll: false,
        parking: false,
        overtime: mode === 'driver' ? 75000 : 100000,
        protection:
          'Perlindungan mitra terbatas; risiko sendiri dan pengecualian dikonfirmasi saat verifikasi.',
        active: true,
      })),
  ),
);
export const carFixture = (id: string) => publicCarFixture(id);

// This partner offers self-drive only; it must never appear in driver searches.
for (const city of LOCATIONS) {
  const base = CAR_OFFERS.find((o) => o.id === `${city.id}-city-self`)!;
  CAR_OFFERS.push({
    ...base,
    id: `${city.id}-city-mandiri-self`,
    providerId: 'mandiri',
    providerName: 'Mandiri Drive',
    rate: 280000,
  });
}
