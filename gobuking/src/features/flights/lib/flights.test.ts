import { describe, it, expect, vi } from 'vitest';
import {
  createFlightAdapter,
  filterFlightOffers,
  FlightError,
} from './adapter';
import { fixtureFlightProvider } from './fixture-provider';
import {
  flightParams,
  flightSchema,
  parseFlightFilters,
  parseFlightQuery,
} from './query';
import {
  arrivalDayOffset,
  airportTime,
  legDuration,
  elapsedMinutes,
} from './time';
import type { FlightEnvelope, FlightProvider, FlightQuery } from './types';
const query: FlightQuery = {
  locationId: 'CGK',
  destinationId: 'DPS',
  start: '2099-12-10',
  trip: 'oneway',
  adults: 2,
  children: 0,
  infants: 0,
  cabin: 'economy',
};
const roundtrip: FlightQuery = {
  ...query,
  trip: 'roundtrip',
  end: '2099-12-14',
};
describe('Flights search-only contract', () => {
  it('drops a hidden return date for one-way search and round-trips passenger and cabin context', () => {
    const input = {
      ...query,
      end: '2099-12-14',
      children: 1,
      infants: 1,
      cabin: 'business' as const,
    };
    expect(flightSchema.parse(input).end).toBeUndefined();
    expect(flightParams(input).has('end')).toBe(false);
    expect(parseFlightQuery(flightParams(input))).toEqual({
      ...input,
      end: undefined,
    });
    expect(
      flightSchema.safeParse({ ...roundtrip, end: undefined }).success,
    ).toBe(false);
  });
  it('rejects invalid route, real calendar dates, passenger limits and infant ratios before supplier access', async () => {
    const provider: FlightProvider = { search: vi.fn() };
    const adapter = createFlightAdapter(provider);
    for (const invalid of [
      { ...query, destinationId: 'CGK' },
      { ...query, locationId: 'XXX' },
      { ...query, start: '2099-02-30' },
      { ...query, start: '2000-01-01' },
      { ...query, adults: 9, children: 1 },
      { ...query, adults: 1, infants: 2 },
      { ...roundtrip, end: '2099-12-09' },
    ]) {
      await expect(adapter.searchFlightOffers(invalid)).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    }
    expect(provider.search).not.toHaveBeenCalled();
  });
  it('returns source identity and total pricing for all passenger types without booking facts', async () => {
    const { data, source, mode } = await fixtureFlightProvider.search(
      { ...query, children: 1, infants: 1 },
      'ready',
    );
    expect(mode).toBe('demo');
    expect(source).toBe('Gobuking Flight Sandbox');
    for (const offer of data) {
      expect(offer.supplierOfferId).toContain('SANDBOX-');
      expect(offer.total).toBe(
        Object.values(offer.price).reduce((a, b) => a + b, 0),
      );
      expect(offer.price.adultTotal).toBeGreaterThan(offer.price.childTotal);
      expect(offer.price.infantTotal).toBeGreaterThan(0);
      expect(offer).not.toHaveProperty('pnr');
      expect(offer).not.toHaveProperty('bookingStatus');
    }
  });
  it('computes elapsed duration from instants and next-day arrival in the destination zone', async () => {
    const { data } = await fixtureFlightProvider.search(query, 'ready');
    const late = data.find((o) =>
      o.outbound.segments[0].departureAt.includes('16:15:00'),
    )!;
    expect(
      airportTime(
        late.outbound.segments[0].departureAt,
        late.outbound.segments[0].origin,
      ),
    ).toBe('23:15');
    expect(arrivalDayOffset(late.outbound)).toBe(1);
    expect(legDuration(late.outbound)).toBe(170);
    const reverse = (
      await fixtureFlightProvider.search(
        { ...query, locationId: 'DPS', destinationId: 'CGK' },
        'ready',
      )
    ).data[0];
    expect(legDuration(reverse.outbound)).toBe(110);
    expect(
      airportTime(
        reverse.outbound.segments[0].arrivalAt,
        reverse.outbound.segments[0].destination,
      ),
    ).toBe('07:10');
  });
  it('preserves transit segments, layover time and unknown baggage instead of assuming free baggage', async () => {
    const { data } = await fixtureFlightProvider.search(query, 'ready');
    const transit = data.find((o) => o.outbound.segments.length === 2)!;
    const [a, b] = transit.outbound.segments;
    expect(legDuration(transit.outbound)).toBe(
      elapsedMinutes(a.departureAt, a.arrivalAt) +
        elapsedMinutes(a.arrivalAt, b.departureAt) +
        elapsedMinutes(b.departureAt, b.arrivalAt),
    );
    expect(
      data.some((o) => o.outbound.segments[0].checkedBaggage === null),
    ).toBe(true);
    const filtered = filterFlightOffers(data, {
      ...parseFlightFilters(new URLSearchParams()),
      stops: 'one',
      sort: 'price',
    });
    expect(filtered.every((o) => o.outbound.segments.length === 2)).toBe(true);
    expect(filtered.map((o) => o.total)).toEqual(
      filtered.map((o) => o.total).sort((a, b) => a - b),
    );
  });
  it('uses compatible supplier combination IDs and never accepts an unrelated return selection', async () => {
    const adapter = createFlightAdapter(fixtureFlightProvider);
    const all = await adapter.searchFlightOffers(roundtrip);
    const group = await adapter.getCompatibleReturnOffers(
      all.data[0].outbound.id,
      roundtrip,
    );
    expect(group.data).toHaveLength(2);
    expect(
      group.data.every(
        (o) => o.outbound.id === all.data[0].outbound.id && o.inbound,
      ),
    ).toBe(true);
    expect(group.data[0].supplierOfferId).not.toBe(
      group.data[1].supplierOfferId,
    );
    expect(group.data[0].total).not.toBe(group.data[1].total);
    expect(
      (await adapter.getCompatibleReturnOffers('unrelated', roundtrip)).data,
    ).toEqual([]);
    await expect(
      adapter.getFlightOffer(all.data[0].id, { ...roundtrip, adults: 1 }),
    ).rejects.toMatchObject({ code: '404' });
  });
  it('omits impossible same-day returns after late outbound arrival', async () => {
    const result = await fixtureFlightProvider.search(
      { ...roundtrip, end: roundtrip.start },
      'ready',
    );
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every(
        (o) =>
          Date.parse(o.inbound!.segments[0].departureAt) >
          Date.parse(o.outbound.segments.at(-1)!.arrivalAt),
      ),
    ).toBe(true);
  });
  it('keeps expiry absent when supplier omits it, and separates empty, expiry and supplier errors', async () => {
    const adapter = createFlightAdapter(fixtureFlightProvider);
    expect((await adapter.searchFlightOffers(query, 'empty')).data).toEqual([]);
    expect(
      (await adapter.searchFlightOffers(query, 'no_expiry')).data.every(
        (o) => o.expiresAt === null,
      ),
    ).toBe(true);
    expect(
      Date.parse(
        (await adapter.searchFlightOffers(query, 'expired')).data[0].expiresAt!,
      ),
    ).toBeLessThan(Date.now());
    for (const [scenario, code] of [
      ['timeout', 'TIMEOUT'],
      ['offline', 'OFFLINE'],
      ['unavailable', 'UNAVAILABLE'],
      ['rate_limited', '429'],
      ['unauthorized', '401'],
      ['forbidden', '403'],
    ] as const) {
      await expect(
        adapter.searchFlightOffers(query, scenario),
      ).rejects.toMatchObject({ code });
    }
  });
  it('caches read-only results per context, clones snapshots and explicitly refreshes the source', async () => {
    const search = vi.fn(fixtureFlightProvider.search);
    const adapter = createFlightAdapter({ search });
    const a = await adapter.searchFlightOffers(query);
    a.data[0].total = 1;
    const b = await adapter.searchFlightOffers(query);
    expect(b.data[0].total).not.toBe(1);
    expect(search).toHaveBeenCalledTimes(1);
    await adapter.searchFlightOffers(query, 'ready', undefined, 'en');
    expect(search).toHaveBeenCalledTimes(2);
    const refreshed = await adapter.refreshFlightSearch(query);
    expect(refreshed.requestId).not.toBe(b.requestId);
  });
  it('rejects an obsolete response even when a supplier ignores the abort signal', async () => {
    let resolve!: (value: FlightEnvelope) => void;
    const adapter = createFlightAdapter({
      search: () =>
        new Promise((r) => {
          resolve = r;
        }),
    });
    const controller = new AbortController();
    const pending = adapter.searchFlightOffers(
      query,
      'ready',
      controller.signal,
    );
    controller.abort();
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    resolve({
      data: [],
      requestId: 'late',
      source: 'demo',
      mode: 'demo',
      fetchedAt: new Date().toISOString(),
      serverTime: new Date().toISOString(),
    });
    await assertion;
    expect(new FlightError('429', 'Wait', 3).retryAfter).toBe(3);
  });
});
