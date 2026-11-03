import { fixtureFlightProvider } from './fixture-provider';
import { FlightError } from './provider-error';
import { flightParams, flightSchema } from './query';
import { airportTime, legDuration } from './time';
import type {
  FlightEnvelope,
  FlightFilters,
  FlightOffer,
  FlightProvider,
  FlightQuery,
  FlightScenario,
} from './types';
export { FlightError } from './provider-error';
export function filterFlightOffers(
  offers: FlightOffer[],
  filters: FlightFilters,
  direction: 'outbound' | 'inbound' = 'outbound',
) {
  return offers
    .filter((offer) => {
      const segments =
        (direction === 'inbound' ? offer.inbound : offer.outbound)?.segments ??
        [];
      if (!segments.length) return false;
      const hour = Number(
        airportTime(segments[0].departureAt, segments[0].origin).slice(0, 2),
      );
      return (
        (!filters.airlines.length ||
          [...segments, ...(offer.inbound?.segments ?? [])].every((s) =>
            filters.airlines.includes(s.airlineId),
          )) &&
        (filters.stops === 'all' ||
          (filters.stops === 'direct'
            ? segments.length === 1
            : segments.length === 2)) &&
        (filters.departure === 'all' ||
          (filters.departure === 'morning'
            ? hour < 12
            : filters.departure === 'afternoon'
              ? hour >= 12 && hour < 18
              : hour >= 18))
      );
    })
    .sort((a, b) =>
      filters.sort === 'price'
        ? a.total - b.total
        : filters.sort === 'duration'
          ? legDuration((direction === 'inbound' ? a.inbound : a.outbound)!) -
            legDuration((direction === 'inbound' ? b.inbound : b.outbound)!)
          : a.outbound.segments.length - b.outbound.segments.length ||
            a.total - b.total,
    );
}
export function createFlightAdapter(provider: FlightProvider) {
  const cache = new Map<string, { at: number; value: FlightEnvelope }>();
  async function searchFlightOffers(
    query: FlightQuery,
    scenario: FlightScenario = 'ready',
    signal?: AbortSignal,
    locale = 'id',
    force = false,
  ) {
    const parsed = flightSchema.safeParse(query);
    if (!parsed.success)
      throw new FlightError('VALIDATION', parsed.error.issues[0].message);
    const key = `${flightParams(parsed.data)}:${scenario}:${locale}`;
    const stored = cache.get(key);
    if (!force && stored && Date.now() - stored.at < 60000) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return structuredClone(stored.value);
    }
    const response = await provider.search(parsed.data, scenario, signal);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (cache.size >= 20) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), value: structuredClone(response) });
    return response;
  }
  return {
    searchFlightOffers,
    async getFlightOffer(
      id: string,
      q: FlightQuery,
      scenario: FlightScenario = 'ready',
      signal?: AbortSignal,
      locale = 'id',
    ) {
      const response = await searchFlightOffers(q, scenario, signal, locale);
      const offer = response.data.find((o) => o.id === id);
      if (!offer)
        throw new FlightError(
          '404',
          'Penawaran tidak aktif atau tidak ditemukan.',
        );
      return {
        offer,
        serverTime: response.serverTime,
        requestId: response.requestId,
      };
    },
    async getCompatibleReturnOffers(
      outboundId: string,
      q: FlightQuery,
      scenario: FlightScenario = 'ready',
      signal?: AbortSignal,
      locale = 'id',
    ) {
      const response = await searchFlightOffers(q, scenario, signal, locale);
      return {
        ...response,
        data: response.data.filter(
          (o) => o.outbound.id === outboundId && o.inbound,
        ),
      };
    },
    refreshFlightSearch(
      q: FlightQuery,
      scenario: FlightScenario = 'ready',
      signal?: AbortSignal,
      locale = 'id',
    ) {
      return searchFlightOffers(q, scenario, signal, locale, true);
    },
  };
}
export const flightAdapter = createFlightAdapter(fixtureFlightProvider);
