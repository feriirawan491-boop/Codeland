import { beforeEach, describe, it, expect } from 'vitest';
import {
  verifyDemoAccount,
  signOutDemoAccount,
} from '@/features/account/lib/demo-auth';
import { carAdapter } from './adapter';
import { carBookingAdapter, canDownloadCarInvoice } from './booking-adapter';
import {
  carQuerySchema,
  carParams,
  parseCarQuery,
  parseCarFilters,
  rentalInterval,
} from './query';
import { carRecords, CAR_RECORD_KEY } from './store';
import { setCarMaintenance, unitPool, unitFree } from './inventory';
import type { CarQuery, CarRenter } from './types';
const query: CarQuery = {
  locationId: 'jakarta',
  pickupArea: 'central',
  returnArea: 'central',
  start: '2099-12-10',
  end: '2099-12-11',
  startTime: '09:00',
  endTime: '10:00',
  mode: 'self',
};
const renter: CarRenter = {
  name: 'Rental Customer',
  age: 30,
  license: true,
  eligibility: true,
  pickupDetail: 'Lobby Hotel Jakarta',
  notes: '',
  consent: true,
};
const login = (email = 'renter@example.com') =>
  verifyDemoAccount(
    'register',
    { name: 'Rental Customer', email, phone: '081234567890' },
    '123456',
  );
async function request(offerId = 'jakarta-mpv-self', q = query) {
  const draft = await carBookingAdapter.createDraft(offerId, q);
  return carBookingAdapter.createRentalRequest(
    draft.id,
    renter,
    `create:${draft.id}`,
  );
}
async function paid() {
  const value = await request();
  await carBookingAdapter.command(value.id, 'approve', 'approve');
  await carBookingAdapter.command(value.id, 'start_payment', 'start', 'qris');
  return carBookingAdapter.command(value.id, 'payment_succeeded', 'paid');
}
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  signOutDemoAccount();
});
describe('Rental public context and prices', () => {
  it('preserves mode and local intervals, rejecting reversed dates, invalid dates and different return areas', () => {
    expect(parseCarQuery(carParams(query))).toEqual(query);
    for (const invalid of [
      { ...query, end: '2099-12-09' },
      { ...query, start: '2099-02-30' },
      { ...query, returnArea: 'airport' },
      { ...query, endTime: '26:00' },
      { ...query, locationId: 'fake' },
      { ...query, pickupArea: 'constructor', returnArea: 'constructor' },
    ])
      expect(carQuerySchema.safeParse(invalid).success).toBe(false);
    expect(
      rentalInterval({ ...query, locationId: 'bali' }).start -
        rentalInterval(query).start,
    ).toBe(-3600000);
  });
  it('keeps mode, passenger seats and known luggage independent and shows total duration pricing', async () => {
    const filters = parseCarFilters(new URLSearchParams('seats=7'));
    const self = await carAdapter.searchRentalOffers(query, filters);
    expect(
      self.every((r) => r.offer.mode === 'self' && r.offer.seats >= 7),
    ).toBe(true);
    expect(self.some((r) => r.offer.vehicleClass === 'van')).toBe(false);
    const unavailablePartner = await carAdapter.searchRentalOffers(
      { ...query, mode: 'driver' },
      { ...filters, seats: 0, provider: 'mandiri' },
    );
    expect(unavailablePartner).toHaveLength(0);
    const driver = await carAdapter.searchRentalOffers(
      { ...query, mode: 'driver' },
      filters,
    );
    expect(
      driver.some(
        (r) => r.offer.vehicleClass === 'van' && r.offer.baggage === null,
      ),
    ).toBe(true);
    const bagged = await carAdapter.searchRentalOffers(
      { ...query, mode: 'driver' },
      { ...filters, baggage: 3 },
    );
    expect(
      bagged.every((r) => r.offer.baggage !== null && r.offer.baggage >= 3),
    ).toBe(true);
    const { quote, offer } = await carAdapter.getRentalOffer(
      'jakarta-mpv-self',
      query,
    );
    expect(quote.durationHours).toBe(25);
    expect(quote.units).toBe(2);
    expect(quote.unitHours).toBe(24);
    expect(quote.total).toBe(
      2 * offer.rate + quote.tax + quote.serviceFee + quote.deliveryFee,
    );
    expect(quote.deposit).toBe(1500000);
    const twelve = await carAdapter.getRentalOffer('jakarta-mpv-driver', {
      ...query,
      mode: 'driver',
      end: query.start,
      endTime: '21:00',
    });
    expect(twelve.quote.units).toBe(1);
    expect(twelve.quote.unitHours).toBe(12);
    expect(twelve.offer.fuel).toBe(true);
    expect(offer.fuel).toBe(false);
    expect(
      (
        await carAdapter.getRentalOffer(
          'jakarta-mpv-self',
          query,
          'driver_busy',
        )
      ).available,
    ).toBe(true);
  });
});
describe('Rental requests, allocation and money boundaries', () => {
  it('requires an account and provider eligibility, never charging for requested or rejected rentals', async () => {
    const draft = await carBookingAdapter.createDraft(
      'jakarta-mpv-self',
      query,
    );
    await expect(
      carBookingAdapter.createRentalRequest(draft.id, renter, 'guest'),
    ).rejects.toMatchObject({ code: '401' });
    await login();
    await expect(
      carBookingAdapter.createRentalRequest(
        draft.id,
        { ...renter, license: false },
        'no-sim',
      ),
    ).rejects.toMatchObject({ code: 'ELIGIBILITY' });
    await expect(
      carBookingAdapter.createRentalRequest(
        draft.id,
        { ...renter, age: 18 },
        'underage',
      ),
    ).rejects.toMatchObject({ code: 'ELIGIBILITY' });
    const value = await carBookingAdapter.createRentalRequest(
      draft.id,
      renter,
      'create',
    );
    expect(value.status).toBe('requested');
    expect(value.assignment).toBeNull();
    expect(value.payment).toBe('not_started');
    await expect(
      carBookingAdapter.command(value.id, 'start_payment', 'early', 'va'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const rejected = await carBookingAdapter.command(
      value.id,
      'reject',
      'reject',
    );
    expect(rejected.reason).toBeTruthy();
    expect(canDownloadCarInvoice(rejected)).toBe(false);
    expect(rejected.invoice).toBeNull();
  });
  it('allocates only two units, rejects concurrent overlap and maintenance/buffer conflicts without leaking internal IDs', async () => {
    await login();
    const [a, b, c] = await Promise.all([request(), request(), request()]);
    const [aa, bb] = await Promise.all([
      carBookingAdapter.command(a.id, 'approve', 'a'),
      carBookingAdapter.command(b.id, 'approve', 'b'),
    ]);
    expect(aa.status).toBe('awaiting_payment');
    expect(bb.status).toBe('awaiting_payment');
    await expect(
      carBookingAdapter.command(c.id, 'approve', 'c'),
    ).rejects.toMatchObject({ code: 'ALLOCATION' });
    expect(aa).not.toHaveProperty('unitId');
    expect(aa).not.toHaveProperty('driverId');
    const unit = carRecords()[a.id].unitId!;
    expect(
      unitFree(
        unit,
        { ...query, start: query.end, startTime: '10:30', end: '2099-12-12' },
        a.offer,
      ),
    ).toBe(false);
    expect(
      unitFree(
        unit,
        { ...query, start: query.end, startTime: '11:00', end: '2099-12-12' },
        a.offer,
      ),
    ).toBe(true);
    const interval = rentalInterval(query);
    setCarMaintenance(unit, interval.start, interval.end);
    await expect(
      carBookingAdapter.command(a.id, 'start_payment', 'maintained', 'va'),
    ).rejects.toMatchObject({ code: 'ALLOCATION' });
  });
  it('checks driver conflicts even when another vehicle unit is free', async () => {
    await login();
    const driverQuery = { ...query, mode: 'driver' as const };
    const a = await request('jakarta-mpv-driver', driverQuery),
      b = await request('jakarta-mpv-driver', driverQuery);
    await carBookingAdapter.command(a.id, 'approve', 'a');
    await expect(
      carBookingAdapter.command(b.id, 'approve', 'b'),
    ).rejects.toMatchObject({ code: 'ALLOCATION' });
  });
  it('releases expired approval and never confirms a late payment or publishes an invoice', async () => {
    await login();
    const a = await request();
    await carBookingAdapter.command(a.id, 'approve', 'a');
    await carBookingAdapter.command(a.id, 'expire', 'expire');
    await expect(
      carBookingAdapter.command(a.id, 'start_payment', 'stale', 'va'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const late = await carBookingAdapter.command(a.id, 'late_payment', 'late');
    expect(late.status).toBe('exception');
    expect(late.refund).toBe('processing');
    expect(late.assignment).toBeNull();
    expect(canDownloadCarInvoice(late)).toBe(false);
    expect(late.invoice).toBeNull();
    const availability = await carAdapter.getRentalOffer(
      'jakarta-mpv-self',
      query,
    );
    expect(availability.available).toBe(true);
  });
  it('reconciles unknown creates and deduplicates concurrent requests by draft', async () => {
    await login();
    const draft = await carBookingAdapter.createDraft(
      'jakarta-mpv-self',
      query,
      'mutation_timeout',
    );
    await expect(
      carBookingAdapter.createRentalRequest(draft.id, renter, 'unknown'),
    ).rejects.toMatchObject({ code: 'UNKNOWN' });
    const found = await carBookingAdapter.resolveSubmission(draft.id);
    expect(found?.status).toBe('requested');
    const retry = await carBookingAdapter.createRentalRequest(
      draft.id,
      renter,
      'retry',
    );
    expect(retry.id).toBe(found?.id);
    expect(Object.values(carRecords())).toHaveLength(1);
    const next = await carBookingAdapter.createDraft('jakarta-mpv-self', query);
    const [a, b] = await Promise.all([
      carBookingAdapter.createRentalRequest(next.id, renter, 'a'),
      carBookingAdapter.createRentalRequest(next.id, renter, 'b'),
    ]);
    expect(a.id).toBe(b.id);
  });
  it('requires review after repricing and checks quote expiry before a request', async () => {
    await login();
    const draft = await carBookingAdapter.createDraft(
      'jakarta-mpv-self',
      query,
    );
    carBookingAdapter.setDraftScenario(draft.id, 'price_changed');
    await expect(
      carBookingAdapter.createRentalRequest(draft.id, renter, 'stale-price'),
    ).rejects.toMatchObject({ code: '409' });
    const updated = await carBookingAdapter.refreshDraft(draft.id);
    expect(updated.quote.total).toBeGreaterThan(draft.quote.total);
    const request = await carBookingAdapter.createRentalRequest(
      draft.id,
      renter,
      'new-price',
    );
    expect(request.quote.total).toBe(updated.quote.total);
    const expired = await carBookingAdapter.createDraft(
      'jakarta-mpv-self',
      query,
      'quote_expired',
    );
    await expect(
      carBookingAdapter.createRentalRequest(expired.id, renter, 'expired'),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
  });
  it('keeps snapshots, requires replacement consent and records handover/dispute separately from charges', async () => {
    await login();
    const value = await paid();
    expect(canDownloadCarInvoice(value)).toBe(true);
    const proposed = await carBookingAdapter.command(
      value.id,
      'propose_replacement',
      'propose',
    );
    expect(proposed.assignment?.model).toBe(value.assignment?.model);
    expect(proposed.replacement?.equivalent).toBe(false);
    await expect(
      carBookingAdapter.command(value.id, 'pickup', 'too-early'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const accepted = await carBookingAdapter.command(
      value.id,
      'accept_replacement',
      'accept',
    );
    expect(accepted.assignment?.model).not.toBe(value.assignment?.model);
    expect(accepted.quote).toEqual(value.quote);
    expect(carRecords()[value.id].unitId).toContain(value.offer.providerId);
    expect(accepted.offer.name).toBe(value.offer.name);
    const picked = await carBookingAdapter.command(
      value.id,
      'pickup',
      'pickup',
    );
    expect(picked.handover.pickup).toBe(true);
    await carBookingAdapter.command(value.id, 'dispute', 'dispute');
    const completed = await carBookingAdapter.command(
      value.id,
      'return',
      'return',
    );
    expect(completed.status).toBe('completed');
    expect(completed.dispute).toBe(true);
    expect(completed.quote.total).toBe(value.quote.total);
    expect(completed.handover.returned).toBe(true);
  });
  it('denies another account, clears unauthenticated access and ignores an in-flight command after logout', async () => {
    await login();
    const value = await request();
    const pending = carBookingAdapter.command(value.id, 'approve', 'pending');
    signOutDemoAccount();
    await expect(pending).rejects.toMatchObject({ code: '401' });
    await expect(
      carBookingAdapter.getBookingStatus(value.id),
    ).rejects.toMatchObject({ code: '401' });
    await login('other@example.com');
    await expect(
      carBookingAdapter.getBookingStatus(value.id),
    ).rejects.toMatchObject({ code: '403' });
    expect(await carBookingAdapter.resolveSubmission(value.draftId)).toBeNull();
  });
  it('expires from adapter facts on status refresh and does not undo a paid rental when invoice email fails', async () => {
    await login();
    const value = await paid();
    const failed = await carBookingAdapter.command(
      value.id,
      'invoice_email_failed',
      'mail',
    );
    expect(failed.status).toBe('confirmed');
    expect(failed.invoice?.emailStatus).toBe('failed');
    expect(canDownloadCarInvoice(failed)).toBe(true);
    const another = await request();
    await carBookingAdapter.command(another.id, 'approve', 'approve');
    const records = carRecords();
    records[another.id].expiresAt = new Date(Date.now() - 1000).toISOString();
    sessionStorage.setItem(CAR_RECORD_KEY, JSON.stringify(records));
    const expired = await carBookingAdapter.getBookingStatus(another.id);
    expect(expired.status).toBe('expired');
  });
  it('rejects maintenance before approval and validates document types only when the provider asks', async () => {
    await login();
    const value = await request();
    const interval = rentalInterval(query);
    for (const unit of unitPool(value.offer))
      setCarMaintenance(unit, interval.start, interval.end);
    await expect(
      carBookingAdapter.command(value.id, 'approve', 'approve'),
    ).rejects.toMatchObject({ code: 'ALLOCATION' });
    const suv = await carBookingAdapter.createDraft('jakarta-suv-self', query);
    await expect(
      carBookingAdapter.createRentalRequest(suv.id, renter, 'missing-file'),
    ).rejects.toMatchObject({ code: 'FILE' });
    const bad = new File(['text'], 'test.txt', { type: 'text/plain' });
    await expect(
      carBookingAdapter.createRentalRequest(suv.id, renter, 'bad-file', bad),
    ).rejects.toMatchObject({ code: 'FILE' });
  });
});
