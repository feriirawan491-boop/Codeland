import { beforeEach, describe, expect, it } from 'vitest';
import {
  verifyDemoAccount,
  signOutDemoAccount,
} from '@/features/account/lib/demo-auth';
import {
  bookingAdapter,
  createHotelDraft,
} from '@/features/hotel/lib/booking-adapter';
import { availableStock, makeQuote } from '@/features/hotel/lib/adapter';
import { HOTEL_FIXTURES } from '@/features/hotel/lib/fixtures';
import { HOME_FIXTURES } from './fixtures';
import {
  calendarDay,
  createHomeDraft,
  homeAvailability,
  makeHomeQuote,
} from './adapter';
import {
  homeParams,
  parseHomeFilters,
  parseHomeQuery,
  validateHomeQuery,
} from './query';
import type { HomeQuery } from './types';
const home = HOME_FIXTURES[0];
const query: HomeQuery = {
  locationId: 'bali',
  start: '2099-12-10',
  end: '2099-12-12',
  adults: 2,
  children: 0,
  childAges: [],
  rooms: 1,
};
const contact = {
  name: 'Test Buyer',
  email: 'buyer@example.com',
  guestName: 'Test Guest',
};
function draft(property = home) {
  return createHomeDraft({
    homeId: property.id,
    query,
    extraIds: [],
    quote: makeHomeQuote(property, query),
    scenario: 'ready',
  });
}
beforeEach(async () => {
  sessionStorage.clear();
  await verifyDemoAccount(
    'register',
    { ...contact, phone: '081234567890' },
    '123456',
  );
});
describe('Entire-home reservations', () => {
  it('normalizes URLs to one unit and rejects forged quantities and invalid dates', () => {
    expect(parseHomeQuery(new URLSearchParams('rooms=9')).rooms).toBe(1);
    expect(homeParams(query).has('rooms')).toBe(false);
    const family = {
      ...query,
      locationId: 'lombok',
      children: 1,
      childAges: ['7'],
    };
    expect(parseHomeQuery(homeParams(family))).toEqual(family);
    expect(
      validateHomeQuery({ ...query, children: 1, childAges: [] }).success,
    ).toBe(false);
    expect(
      validateHomeQuery({ ...query, rooms: 2 } as unknown as HomeQuery).success,
    ).toBe(false);
    expect(validateHomeQuery({ ...query, start: '2099-02-30' }).success).toBe(
      false,
    );
    expect(
      parseHomeFilters(new URLSearchParams('minBedrooms=2.9')).minBedrooms,
    ).toBe(2);
  });
  it('charges cleaning and stay extras once, excluding the host deposit', () => {
    const q = makeHomeQuote(home, query, ['extra-cleaning']);
    const longer = makeHomeQuote(home, { ...query, end: '2099-12-13' }, [
      'extra-cleaning',
    ]);
    expect(q.cleaningFee).toBe(home.cleaningFee);
    expect(longer.cleaningFee).toBe(q.cleaningFee);
    expect(longer.extras).toEqual(q.extras);
    expect(q.total).toBe(
      q.base + q.cleaningFee + 150000 + q.tax + q.serviceFee,
    );
  });
  it('checks group capacity, minimum nights, owner blocks and cleaning buffers', () => {
    expect(
      homeAvailability(home, { ...query, adults: home.maxGuests + 1 }),
    ).toMatch(/kapasitas/);
    expect(homeAvailability(home, { ...query, end: '2099-12-11' })).toMatch(
      /minimum/,
    );
    const blocked = {
      ...home,
      ownerBlocks: [{ start: '2099-12-11', end: '2099-12-13' }],
    };
    expect(calendarDay(blocked, '2099-12-11').reason).toBe('owner');
    expect(calendarDay(blocked, '2099-12-10').reason).toBe('buffer');
    expect(homeAvailability(blocked, query)).toBeTruthy();
  });
  it('requires login and house-rule consent', async () => {
    const d = draft();
    await expect(
      bookingAdapter.createHomeBooking(d, '1', 'va', contact, false),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    signOutDemoAccount();
    await expect(
      bookingAdapter.createHomeBooking(d, '1', 'va', contact, true),
    ).rejects.toMatchObject({ code: '401' });
  });
  it('deduplicates concurrent checkout and prevents overlapping new reservations', async () => {
    const d = draft();
    const [a, b] = await Promise.all([
      bookingAdapter.createHomeBooking(d, '1', 'qris', contact, true),
      bookingAdapter.createHomeBooking(d, '1', 'qris', contact, true),
    ]);
    expect(a.id).toBe(b.id);
    expect(a.bookingStatus).toBe('awaiting_payment');
    await expect(
      bookingAdapter.createHomeBooking(draft(), '1', 'va', contact, true),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(calendarDay(home, '2099-12-12').reason).toBe('buffer');
  });
  it('shares physical stock with Hotel and releases an unpaid cancelled hold', async () => {
    const linked = HOME_FIXTURES.find((h) => h.id === 'seruni-residence')!;
    const hotel = HOTEL_FIXTURES.find((h) => h.id === 'seruni')!;
    const suite = hotel.rooms.find((r) => r.id === 'suite')!;
    expect(availableStock(suite, query)).toBe(1);
    const b = await bookingAdapter.createHomeBooking(
      draft(linked),
      '1',
      'va',
      contact,
      true,
    );
    expect(availableStock(suite, query)).toBe(0);
    await bookingAdapter.command(b.id, 'cancel', 'cancel');
    expect(availableStock(suite, query)).toBe(1);
  });
  it('exposes arrival instructions only after payment and only to the owner', async () => {
    const b = await bookingAdapter.createHomeBooking(
      draft(),
      '1',
      'va',
      contact,
      true,
    );
    await expect(
      bookingAdapter.getHomeArrivalInstructions(b.id),
    ).rejects.toBeTruthy();
    await bookingAdapter.command(b.id, 'start_payment', 'start');
    const paid = await bookingAdapter.command(
      b.id,
      'payment_succeeded',
      'paid',
    );
    expect(paid.invoice).toBeDefined();
    expect(paid.home?.deposit.amount).toBe(home.deposit.amount);
    expect(
      (await bookingAdapter.getHomeArrivalInstructions(b.id)).hostName,
    ).toBe(home.host.name);
    await verifyDemoAccount(
      'register',
      { name: 'Other User', email: 'other@example.com', phone: '081234567891' },
      '123456',
    );
    await expect(
      bookingAdapter.getHomeArrivalInstructions(b.id),
    ).rejects.toMatchObject({ code: '403' });
  });
  it('blocks Home Rental when the shared suite was booked through Hotel', async () => {
    const linked = HOME_FIXTURES.find((h) => h.id === 'seruni-residence')!;
    const hotel = HOTEL_FIXTURES.find((h) => h.id === 'seruni')!;
    const room = hotel.rooms.find((r) => r.id === 'suite')!;
    const rate = room.rates[0];
    const d = createHotelDraft({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: rate.id,
      query,
      quote: makeQuote(hotel, room, rate, query),
      scenario: 'ready',
    });
    const booking = await bookingAdapter.createBooking(d, '1', 'va', contact);
    expect(calendarDay(linked, query.start).reason).toBe('reserved');
    await expect(
      bookingAdapter.createHomeBooking(draft(linked), '1', 'va', contact, true),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await bookingAdapter.command(booking.id, 'expire', 'expire');
    expect(calendarDay(linked, query.start).available).toBe(true);
  });
  it('requires accepting changed prices and refreshing expired quotes', async () => {
    const changed = { ...draft(), scenario: 'price_changed' as const };
    await expect(
      bookingAdapter.createHomeBooking(changed, '1', 'va', contact, true),
    ).rejects.toMatchObject({ code: 'PRICE_CHANGED' });
    const expired = draft();
    expired.quote.expiresAt = new Date(0).toISOString();
    await expect(
      bookingAdapter.createHomeBooking(expired, '1', 'va', contact, true),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
  });
});
