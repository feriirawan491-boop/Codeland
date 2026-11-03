import {
  verifyDemoAccount,
  signOutDemoAccount,
} from '@/features/account/lib/demo-auth';
import { beforeEach, describe, expect, it } from 'vitest';
import { canDownloadBookingInvoice, issueDemoInvoice } from './invoice';
import { availableStock, hotelAdapter, makeQuote } from './adapter';
import {
  bookingAdapter,
  createHotelDraft,
  heldRoomCount,
} from './booking-adapter';
import { HOTEL_FIXTURES } from './fixtures';
import { parseHotelFilters, validateHotelQuery } from './query';
import type { HotelQuery, DemoBooking } from './types';
const query: HotelQuery = {
  locationId: 'bali',
  start: '2099-12-10',
  end: '2099-12-12',
  adults: 2,
  children: 0,
  childAges: [],
  rooms: 1,
};
const hotel = HOTEL_FIXTURES[0];
const room = hotel.rooms[0];
function draft(h = hotel, q = query, rate = 'flex-breakfast') {
  return createHotelDraft({
    hotelId: h.id,
    roomId: 'deluxe',
    rateId: rate,
    query: q,
    quote: makeQuote(
      h,
      h.rooms[0],
      h.rooms[0].rates.find((r) => r.id === rate)!,
      q,
    ),
    scenario: 'ready',
  });
}
beforeEach(async () => {
  sessionStorage.clear();
  await verifyDemoAccount(
    'register',
    { name: 'Test Buyer', email: 'buyer@example.com', phone: '081234567890' },
    '123456',
  );
});
describe('Hotel pricing and availability', () => {
  it('rejects invalid calendar dates and excessive stay durations from the URL', () => {
    expect(
      validateHotelQuery({ ...query, start: '2099-02-30', end: '2099-03-05' })
        .success,
    ).toBe(false);
    expect(
      validateHotelQuery({ ...query, start: '2099-01-01', end: '2099-12-12' })
        .success,
    ).toBe(false);
  });
  it('calculates the entire stay, room quantity, taxes and service once', () => {
    const q = makeQuote(hotel, room, room.rates[0], { ...query, rooms: 2 });
    expect(q.base).toBe(5000000);
    expect(q.tax).toBe(550000);
    expect(q.total).toBe(5595000);
  });
  it('rejects a room unavailable on just one night and checks occupancy', async () => {
    const blocked = {
      ...hotel,
      rooms: [{ ...room, inventoryByDate: { '2099-12-11': 0 } }],
    };
    expect(availableStock(blocked.rooms[0], query)).toBe(0);
    await expect(
      hotelAdapter.previewBooking(blocked, 'deluxe', 'flex-breakfast', query),
    ).rejects.toMatchObject({ code: 'SOLD_OUT' });
    await expect(
      hotelAdapter.previewBooking(hotel, 'deluxe', 'flex-breakfast', {
        ...query,
        adults: 4,
      }),
    ).rejects.toMatchObject({ code: 'SOLD_OUT' });
  });
  it('sorts and filters using all-inclusive totals', async () => {
    const filters = parseHotelFilters(new URLSearchParams('sort=price'));
    const results = await hotelAdapter.searchHotels(query, filters);
    expect(results.length).toBeGreaterThan(6);
    expect(results.map((r) => r.quote.total)).toEqual(
      results.map((r) => r.quote.total).sort((a, b) => a - b),
    );
    const capped = await hotelAdapter.searchHotels(query, {
      ...filters,
      maxTotal: results[0].quote.total,
      breakfast: true,
    });
    expect(
      capped.every(
        (r) => r.quote.total <= results[0].quote.total && r.rate.breakfast,
      ),
    ).toBe(true);
  });
  it('requires explicit acceptance of repricing and prevents expired quotes', async () => {
    const changed = { ...draft(), scenario: 'price_changed' as const };
    await expect(
      bookingAdapter.createBooking(changed, '1'),
    ).rejects.toMatchObject({ code: 'PRICE_CHANGED' });
    const expired = draft();
    expired.quote.expiresAt = new Date(0).toISOString();
    await expect(
      bookingAdapter.createBooking(expired, '1'),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
  });
});
describe('Demo booking state contract', () => {
  it('deduplicates concurrent submissions for one draft', async () => {
    const d = draft();
    const [a, b] = await Promise.all([
      bookingAdapter.createBooking(d, '1'),
      bookingAdapter.createBooking(d, '1'),
    ]);
    expect(a.id).toBe(b.id);
    expect(heldRoomCount(hotel.id, 'deluxe', query)).toBe(1);
  });
  it('shares inventory across rates and releases cancelled holds', async () => {
    const first = await bookingAdapter.createBooking(
      draft(hotel, { ...query, rooms: 4 }),
      '1',
    );
    await expect(
      bookingAdapter.createBooking(
        draft(hotel, { ...query, rooms: 2 }, 'room-only'),
        '1',
      ),
    ).rejects.toMatchObject({ code: 'SOLD_OUT' });
    await bookingAdapter.command(first.id, 'cancel', 'cancel');
    expect(heldRoomCount(hotel.id, 'deluxe', query)).toBe(0);
  });
  it('holds the maximum nightly quantity rather than adding non-overlapping nights', async () => {
    await bookingAdapter.createBooking(
      draft(hotel, { ...query, end: '2099-12-11', rooms: 3 }),
      '1',
    );
    await bookingAdapter.createBooking(
      draft(hotel, { ...query, start: '2099-12-11', rooms: 3 }),
      '1',
    );
    expect(heldRoomCount(hotel.id, 'deluxe', query)).toBe(3);
  });
  it('requires a signed-in account before creating a booking', async () => {
    signOutDemoAccount();
    await expect(
      bookingAdapter.createBooking(draft(), '1'),
    ).rejects.toMatchObject({ code: '401' });
  });
  it('opens payment immediately for every hotel, including previous request properties', async () => {
    const property = HOTEL_FIXTURES.find((h) => h.id === 'savana')!;
    const b = await bookingAdapter.createBooking(draft(property), '1', 'qris');
    expect(b.bookingStatus).toBe('awaiting_payment');
    expect(b.paymentMethod).toBe('qris');
    const paying = await bookingAdapter.command(b.id, 'start_payment', 'pay');
    expect(paying.paymentStatus).toBe('pending');
    expect(paying.bookingStatus).toBe('awaiting_payment');
  });
  it('prevents another account from viewing or changing a booking', async () => {
    const b = await bookingAdapter.createBooking(draft(), '1');
    await verifyDemoAccount(
      'register',
      {
        name: 'Other Buyer',
        email: 'other@example.com',
        phone: '081234567891',
      },
      '123456',
    );
    await expect(bookingAdapter.getBooking(b.id)).rejects.toMatchObject({
      code: '403',
    });
    await expect(
      bookingAdapter.command(b.id, 'cancel', 'other-cancel'),
    ).rejects.toMatchObject({ code: '403' });
  });
  it('confirms only after payment success and keeps cancellation and refund separate', async () => {
    const b = await bookingAdapter.createBooking(draft(), '1');
    const pending = await bookingAdapter.command(b.id, 'start_payment', 'pay');
    expect(pending.bookingStatus).toBe('awaiting_payment');
    const confirmed = await bookingAdapter.command(
      b.id,
      'payment_succeeded',
      'gateway-success',
    );
    expect(confirmed.bookingStatus).toBe('confirmed');
    const replay = await bookingAdapter.command(
      b.id,
      'payment_succeeded',
      'gateway-success',
    );
    expect(replay.events.length).toBe(confirmed.events.length);
    const cancelled = await bookingAdapter.command(b.id, 'cancel', 'cancel');
    expect(cancelled.bookingStatus).toBe('cancelled');
    expect(cancelled.paymentStatus).toBe('succeeded');
    expect(cancelled.refundStatus).toBe('processing');
    expect(cancelled.refundAmount).toBe(cancelled.quote.total);
    const refund = await bookingAdapter.command(
      b.id,
      'refund_succeeded',
      'refund',
    );
    expect(refund.refundStatus).toBe('succeeded');
  });
  it('keeps late payment in an exception without confirming a reservation', async () => {
    const b = await bookingAdapter.createBooking(draft(), '1');
    await bookingAdapter.command(b.id, 'expire', 'expire');
    const late = await bookingAdapter.command(b.id, 'late_payment', 'late');
    expect(late.bookingStatus).toBe('exception');
    expect(late.paymentStatus).toBe('succeeded');
    expect(late.invoice).toBeUndefined();
    expect(canDownloadBookingInvoice(late)).toBe(false);
  });
  it('issues one paid invoice using checkout contact and keeps email failure independent', async () => {
    const b = await bookingAdapter.createBooking(draft(), '1', 'qris', {
      name: 'Contact Buyer',
      email: 'invoice@example.com',
      guestName: 'Staying Guest',
    });
    expect(canDownloadBookingInvoice(b)).toBe(false);
    expect(() => issueDemoInvoice(b, 'invoice@example.com', null)).toThrow();
    await bookingAdapter.command(b.id, 'start_payment', 'pay');
    const paid = await bookingAdapter.command(
      b.id,
      'payment_succeeded',
      'success',
    );
    expect(canDownloadBookingInvoice(paid)).toBe(true);
    expect(paid.invoice?.recipientEmail).toBe('invoice@example.com');
    expect(paid.contact?.guestName).toBe('Staying Guest');
    expect(paid.invoice?.emailStatus).toBe('simulated');
    const replay = await bookingAdapter.command(
      b.id,
      'payment_succeeded',
      'success',
    );
    expect(replay.invoice).toEqual(paid.invoice);
    expect(replay.events).toHaveLength(paid.events.length);
    const failed = await bookingAdapter.command(
      b.id,
      'invoice_email_failed',
      'email-fail',
    );
    expect(failed.invoice?.emailStatus).toBe('failed');
    expect(failed.bookingStatus).toBe('confirmed');
    expect(canDownloadBookingInvoice(failed)).toBe(true);
    const resend = await bookingAdapter.command(
      b.id,
      'resend_invoice',
      'resend',
    );
    expect(resend.invoice?.number).toBe(paid.invoice?.number);
    expect(resend.invoice?.emailAttempts).toBe(2);
    expect(resend.invoice?.emailStatus).toBe('simulated');
    const duplicate = await bookingAdapter.command(
      b.id,
      'resend_invoice',
      'resend',
    );
    expect(duplicate.invoice?.emailAttempts).toBe(2);
    const cancelled = await bookingAdapter.command(
      b.id,
      'cancel',
      'cancel-invoice',
    );
    expect(canDownloadBookingInvoice(cancelled)).toBe(true);
    expect(cancelled.invoice?.number).toBe(paid.invoice?.number);
  });
  it('upgrades previous paid demo records once without inventing guest details', async () => {
    const b = await bookingAdapter.createBooking(draft(), '1');
    await bookingAdapter.command(b.id, 'start_payment', 'pay');
    await bookingAdapter.command(b.id, 'payment_succeeded', 'success');
    const records = JSON.parse(
      sessionStorage.getItem('gobuking:hotel-bookings:v1')!,
    ) as Record<string, DemoBooking>;
    delete records[b.id].invoice;
    delete records[b.id].contact;
    sessionStorage.setItem(
      'gobuking:hotel-bookings:v1',
      JSON.stringify(records),
    );
    const upgraded = await bookingAdapter.getBooking(b.id);
    expect(upgraded.contact?.guestName).toBe('');
    expect(canDownloadBookingInvoice(upgraded)).toBe(true);
    const reload = await bookingAdapter.getBooking(b.id);
    expect(reload.invoice).toEqual(upgraded.invoice);
    expect(reload.events.length).toBe(upgraded.events.length);
  });
});
