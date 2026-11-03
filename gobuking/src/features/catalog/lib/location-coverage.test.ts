import { describe, expect, it } from 'vitest';
import { carAdapter } from '@/features/car/lib/adapter';
import { parseCarFilters } from '@/features/car/lib/query';
import { LOCATIONS } from '@/features/home/lib/search';
import { homeAdapter } from '@/features/home-rental/lib/adapter';
import { parseHomeFilters } from '@/features/home-rental/lib/query';
import { hotelAdapter } from '@/features/hotel/lib/adapter';
import { parseHotelFilters } from '@/features/hotel/lib/query';
import { FLIGHT_AIRPORTS } from '@/features/flights/lib/config';
import { flightAdapter } from '@/features/flights/lib/adapter';
import { venueAdapter } from '@/features/venue/lib/adapter';
import { parseVenueFilters } from '@/features/venue/lib/query';
import { weddingAdapter } from '@/features/wedding/lib/adapter';
import { parseWeddingFilters } from '@/features/wedding/lib/query';

const start = '2099-12-10';

describe('demo search coverage by selected location', () => {
  it('returns at least five offers for every selectable service location', async () => {
    const hotelFilters = parseHotelFilters(new URLSearchParams());
    const homeFilters = parseHomeFilters(new URLSearchParams());
    const venueFilters = parseVenueFilters(new URLSearchParams());
    const weddingFilters = parseWeddingFilters(new URLSearchParams());
    const carFilters = parseCarFilters(new URLSearchParams());

    const searches = LOCATIONS.flatMap((location) => {
      const hotelQuery = {
        locationId: location.id,
        start,
        end: '2099-12-12',
        adults: 2,
        children: 0,
        childAges: [],
        rooms: 1,
      };
      const eventQuery = {
        locationId: location.id,
        start,
        end: start,
        startTime: '09:00',
        endTime: '17:00',
        flexible: false,
        participants: 50,
        layout: 'theater' as const,
        eventType: 'meeting' as const,
      };
      const carQuery = {
        locationId: location.id,
        pickupArea: 'central',
        returnArea: 'central',
        start,
        end: '2099-12-11',
        startTime: '09:00',
        endTime: '10:00',
        mode: 'self' as const,
      };

      return [
        hotelAdapter.searchHotels(hotelQuery, hotelFilters).then((results) => {
          expect(
            results.length,
            `hotels in ${location.label}`,
          ).toBeGreaterThanOrEqual(5);
        }),
        homeAdapter
          .searchHomes({ ...hotelQuery, rooms: 1 }, homeFilters)
          .then((results) => {
            expect(
              results.length,
              `home rentals in ${location.label}`,
            ).toBeGreaterThanOrEqual(5);
          }),
        venueAdapter
          .searchMeetingSpaces(eventQuery, venueFilters)
          .then((results) => {
            expect(
              results.length,
              `MICE venues in ${location.label}`,
            ).toBeGreaterThanOrEqual(5);
          }),
        weddingAdapter
          .searchWeddingVenues(
            { ...eventQuery, layout: 'banquet' },
            weddingFilters,
          )
          .then((results) => {
            expect(
              results.length,
              `wedding venues in ${location.label}`,
            ).toBeGreaterThanOrEqual(5);
          }),
        carAdapter.searchRentalOffers(carQuery, carFilters).then((results) => {
          expect(
            results.length,
            `self-drive offers in ${location.label}`,
          ).toBeGreaterThanOrEqual(5);
        }),
      ];
    });

    await Promise.all(searches);
  }, 15000);

  it('returns flight offers from every selectable airport', async () => {
    const searches = FLIGHT_AIRPORTS.map((origin, index) => {
      const destination = FLIGHT_AIRPORTS[(index + 1) % FLIGHT_AIRPORTS.length];
      return flightAdapter
        .searchFlightOffers({
          locationId: origin.id,
          destinationId: destination.id,
          start,
          trip: 'oneway',
          adults: 2,
          children: 0,
          infants: 0,
          cabin: 'economy',
        })
        .then((result) => {
          expect(
            result.data.length,
            `flights from ${origin.city}`,
          ).toBeGreaterThanOrEqual(5);
        });
    });

    await Promise.all(searches);
  });
});
