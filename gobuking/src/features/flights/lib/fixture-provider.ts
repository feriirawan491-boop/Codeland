import { FLIGHT_AIRLINES, FLIGHT_AIRPORTS, flightAirport } from './config';
import { addMinutes, localInstant } from './time';
import type {
  Airport,
  FlightEnvelope,
  FlightLeg,
  FlightOffer,
  FlightProvider,
  FlightQuery,
  FlightScenario,
} from './types';
import { FlightError } from './provider-error';
const SOURCE = 'Gobuking Flight Sandbox';
function leg(
  q: FlightQuery,
  origin: Airport,
  destination: Airport,
  date: string,
  index: number,
  returnIndex?: number,
): FlightLeg {
  const airline = FLIGHT_AIRLINES[index % 3];
  const stop = index === 3 || index === 5 || index === 7;
  const via = FLIGHT_AIRPORTS.find(
    (a) => a.id !== origin.id && a.id !== destination.id,
  )!;
  const time = (
    returnIndex === undefined
      ? ['06:20', '08:45', '11:10', '12:30', '16:15', '19:20', '23:15', '21:40']
      : returnIndex === 0
        ? ['09:30']
        : ['18:45']
  )[returnIndex === undefined ? index : 0];
  const departure = localInstant(date, time, origin);
  const id = `${origin.id}-${destination.id}-${date}-${index}-${returnIndex ?? 'out'}`;
  const segment = (
    from: Airport,
    to: Airport,
    start: string,
    duration: number,
    n: number,
  ) => ({
    id: `${id}-${n}`,
    airlineId: airline.id,
    airline: airline.name,
    number: `${airline.code} ${310 + index * 10 + n}`,
    origin: from,
    destination: to,
    departureAt: start,
    arrivalAt: addMinutes(start, duration),
    cabin: q.cabin,
    checkedBaggage: index === 4 ? null : '20 kg',
    cabinBaggage: index === 4 ? null : '7 kg',
  });
  if (stop) {
    const first = segment(origin, via, departure, 85, 1);
    return {
      id,
      segments: [
        first,
        segment(
          via,
          destination,
          addMinutes(first.arrivalAt, 85 + index * 10),
          100,
          2,
        ),
      ],
    };
  }
  return {
    id,
    segments: [segment(origin, destination, departure, 110 + index * 10, 1)],
  };
}
function makeOffers(q: FlightQuery, scenario: FlightScenario): FlightEnvelope {
  const now = new Date().toISOString(),
    fetchedAt =
      scenario === 'expired'
        ? new Date(Date.now() - 20 * 60000).toISOString()
        : now;
  const expiresAt =
    scenario === 'no_expiry'
      ? null
      : new Date(Date.parse(fetchedAt) + 15 * 60000).toISOString();
  const origin = flightAirport(q.locationId)!,
    destination = flightAirport(q.destinationId)!;
  const offers: FlightOffer[] = [];
  for (let i = 0; i < 8; i++) {
    const outbound = leg(q, origin, destination, q.start, i);
    for (let r = 0; r < (q.trip === 'roundtrip' ? 2 : 1); r++) {
      const inbound =
        q.trip === 'roundtrip'
          ? leg(q, destination, origin, q.end!, i, r)
          : null;
      if (
        inbound &&
        Date.parse(inbound.segments[0].departureAt) <=
          Date.parse(outbound.segments.at(-1)!.arrivalAt) + 60 * 60000
      )
        continue;
      // This table represents supplier-priced combinations in the demo provider. UI never adds separate legs.
      const amount =
        (q.trip === 'roundtrip'
          ? [
              2450000, 2780000, 2190000, 1890000, 3100000, 2050000, 2320000,
              1750000,
            ][i] + (r ? 135000 + i * 25000 : 0)
          : [
              1250000, 1450000, 1115000, 975000, 1650000, 1075000, 1195000,
              890000,
            ][i]) * (q.cabin === 'business' ? 2.6 : 1);
      const price = {
        adultTotal: Math.round(amount * q.adults),
        childTotal: Math.round(amount * 0.85 * q.children),
        infantTotal: Math.round(amount * 0.1 * q.infants),
        taxesAndFees: 65000 * (q.adults + q.children) + 15000 * q.infants,
      };
      const routeKey = `${q.locationId}-${q.destinationId}-${q.start}-${q.end ?? 'ow'}-${q.adults}-${q.children}-${q.infants}-${q.cabin}`;
      offers.push({
        id: `DEMO-FLT-${routeKey}-${i}-${r}`,
        supplierOfferId: `SANDBOX-${routeKey}-${i}-${r}`,
        source: SOURCE,
        outbound,
        inbound,
        total: Object.values(price).reduce((a, b) => a + b, 0),
        price,
        currency: 'IDR',
        fetchedAt,
        expiresAt,
        fareConditions: [
          'Contoh tarif demo, bukan penawaran maskapai nyata.',
          'Bagasi dan ketentuan akhir harus dikonfirmasi dari supplier.',
          'Tiket, pembayaran, dan perubahan jadwal belum tersedia di fase ini.',
        ],
      });
    }
  }
  return {
    data: scenario === 'empty' ? [] : offers,
    requestId: `flight-${crypto.randomUUID()}`,
    fetchedAt,
    serverTime: now,
    source: SOURCE,
    mode: 'demo',
  };
}
export const fixtureFlightProvider: FlightProvider = {
  async search(q, scenario, signal) {
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(
        resolve,
        scenario === 'loading' ? 1400 : scenario === 'timeout' ? 700 : 220,
      );
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
    const errors: Partial<Record<FlightScenario, [string, string, number?]>> = {
      timeout: [
        'TIMEOUT',
        'Pencarian melewati batas waktu. Coba lagi atau ubah pencarian.',
      ],
      rate_limited: [
        '429',
        'Batas permintaan supplier tercapai. Tunggu sebelum mencoba lagi.',
        3,
      ],
      offline: [
        'OFFLINE',
        'Koneksi terputus. Periksa jaringan lalu coba lagi.',
      ],
      unavailable: ['UNAVAILABLE', 'Harga penerbangan sedang tidak tersedia.'],
      error: ['SUPPLIER', 'Supplier belum dapat merespons pencarian.'],
      unauthorized: ['401', 'Akses supplier belum tersedia untuk sesi ini.'],
      forbidden: ['403', 'Anda tidak memiliki akses ke hasil ini.'],
      inactive: ['404', 'Penawaran tidak aktif atau tidak ditemukan.'],
    };
    const error = errors[scenario];
    if (error) throw new FlightError(...error);
    return makeOffers(q, scenario);
  },
};
