import { beforeEach, describe, expect, it } from 'vitest';
import {
  signOutDemoAccount,
  verifyDemoAccount,
} from '@/features/account/lib/demo-auth';
import { venueAdapter } from './adapter';
import { inquiryAdapter } from './inquiry-adapter';
import {
  eventParams,
  eventSchema,
  parseEventQuery,
  parseVenueFilters,
} from './query';
import { packageEstimate } from './pricing';
import { setDemoOperationalBlock, spaceAvailable } from './resources';
import { validateInquiryFile } from './attachments';
import type { EventQuery, InquiryInput } from './types';
const query: EventQuery = {
  locationId: 'jakarta',
  start: '2099-12-10',
  end: '2099-12-10',
  startTime: '09:00',
  endTime: '17:00',
  flexible: false,
  participants: 50,
  layout: 'theater',
  eventType: 'meeting',
};
const context = venueAdapter.getSpaceById('cendana-hall')!;
const input: InquiryInput = {
  service: 'mice',
  spaceId: context.space.id,
  packageId: context.space.packages[0].id,
  event: query,
  contact: {
    name: 'Event Owner',
    email: 'owner@example.com',
    phone: '081234567890',
    company: 'Sample Company',
  },
  needs: { av: true, catering: true, rooms: 0, notes: '' },
  consent: true,
};
async function login(email = 'owner@example.com') {
  return verifyDemoAccount(
    'register',
    { name: 'Event Owner', email, phone: '081234567890' },
    '123456',
  );
}
async function verified(command = 'create') {
  const value = await inquiryAdapter.createInquiry(input, command);
  await inquiryAdapter.verifyInquiryContact(value.id, '123456');
  return value.id;
}
async function quoted() {
  const id = await verified();
  await inquiryAdapter.simulateSales(id, 'quote', 'quote1');
  return await inquiryAdapter.getInquiry(id);
}
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  signOutDemoAccount();
});
describe('MICE public search and packages', () => {
  it('ignores definite dates in flexible mode and validates positive participants and time intervals', () => {
    const flexible = {
      ...query,
      flexible: true,
      start: '',
      end: '',
      startTime: '',
      endTime: '',
    };
    expect(eventSchema.safeParse(flexible).success).toBe(true);
    expect(eventParams(flexible).has('start')).toBe(false);
    expect(eventParams(flexible).has('startTime')).toBe(false);
    expect(parseEventQuery(eventParams(query))).toEqual(query);
    for (const bad of [
      { ...query, participants: 0 },
      { ...query, start: '2099-02-30' },
      { ...query, endTime: '08:00' },
      { ...query, endTime: '25:00' },
      { ...query, locationId: 'fake' },
    ])
      expect(eventSchema.safeParse(bad).success).toBe(false);
  });
  it('matches room capacity per layout instead of venue or theater totals', async () => {
    expect(context.space.capacity.theater).toBe(150);
    expect(context.space.capacity.classroom).toBe(80);
    const results = await venueAdapter.searchMeetingSpaces(
      { ...query, participants: 100, layout: 'classroom' },
      parseVenueFilters(new URLSearchParams()),
    );
    expect(results.some((r) => r.space.id === 'cendana-hall')).toBe(false);
    expect(results.every((r) => (r.space.capacity.classroom ?? 0) >= 100)).toBe(
      true,
    );
    const small = await venueAdapter.getMeetingSpace('meranti-boardroom');
    expect(small.space.area).not.toBe(context.space.area);
  });
  it('includes only confirmed AV and compares rates only within the selected basis', async () => {
    const filters = parseVenueFilters(
      new URLSearchParams('facilities=av&basis=hour&sort=price'),
    );
    const results = await venueAdapter.searchMeetingSpaces(query, filters);
    expect(results.length).toBeGreaterThan(1);
    expect(
      results.every(
        (r) => r.space.facilities.av === true && r.package?.basis === 'hour',
      ),
    ).toBe(true);
    const prices = results.map((r) => r.package!.amount!);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(parseVenueFilters(new URLSearchParams('sort=price')).sort).toBe(
      'recommended',
    );
  });
  it('uses the minimum participant count and exposes taxes and service without claiming a final total', () => {
    const pack = context.space.packages[0];
    const estimate = packageEstimate(pack, { ...query, participants: 40 })!;
    expect(estimate.belowMinimum).toBe(true);
    expect(estimate.units).toBe(50);
    expect(estimate.base).toBe(185000 * 50);
    expect(estimate.total).toBe(
      estimate.base + estimate.tax + estimate.serviceFee,
    );
    expect(packageEstimate(context.space.packages[3], query)).toBeNull();
  });
});
describe('Inquiry verification, ownership and quote lifecycle', () => {
  it('keeps an unverified inquiry out of quote handling and deduplicates retry/concurrent submissions', async () => {
    const [a, b] = await Promise.all([
      inquiryAdapter.createInquiry(input, 'same'),
      inquiryAdapter.createInquiry(input, 'same'),
    ]);
    expect(a.id).toBe(b.id);
    expect(a.verifiedAt).toBeNull();
    await expect(inquiryAdapter.getQuoteVersions(a.id)).rejects.toMatchObject({
      code: 'UNVERIFIED',
    });
    await expect(
      inquiryAdapter.verifyInquiryContact(a.id, '000000'),
    ).rejects.toMatchObject({ code: 'OTP' });
    const verified = await inquiryAdapter.verifyInquiryContact(a.id, '123456');
    expect(verified.verifiedAt).toBeTruthy();
    expect(verified.responseDueAt).toBeTruthy();
    const again = await inquiryAdapter.verifyInquiryContact(a.id, '123456');
    expect(again.history).toHaveLength(verified.history.length);
  });
  it('requires verified contact, latest quote, valid expiry, explicit consent and login', async () => {
    const value = await quoted();
    const q1 = value.quotes[0];
    await expect(
      inquiryAdapter.submitVenueRequest(value.id, q1.id, 1, 'r', true),
    ).rejects.toMatchObject({ code: '401' });
    await login();
    const revised = await inquiryAdapter.simulateSales(
      value.id,
      'quote',
      'quote2',
    );
    const q2 = revised.quotes[1];
    expect(revised.quotes[0].status).toBe('superseded');
    await expect(
      inquiryAdapter.submitVenueRequest(value.id, q1.id, 1, 'old', true),
    ).rejects.toMatchObject({ code: '409', latestVersion: 2 });
    await expect(
      inquiryAdapter.submitVenueRequest(
        value.id,
        q2.id,
        2,
        'no-consent',
        false,
      ),
    ).rejects.toMatchObject({ code: 'CONSENT' });
    await inquiryAdapter.simulateSales(value.id, 'expire', 'expire');
    await expect(
      inquiryAdapter.submitVenueRequest(value.id, q2.id, 2, 'expired', true),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
  });
  it('blocks stale resource requests without locking inventory for inquiries or requests', async () => {
    const value = await quoted();
    await login();
    const quote = value.quotes[0];
    expect(spaceAvailable(context.space, query, context.venue)).toBe(true);
    setDemoOperationalBlock(context.space.resourceId, true);
    await expect(
      inquiryAdapter.submitVenueRequest(value.id, quote.id, 1, 'blocked', true),
    ).rejects.toMatchObject({ code: 'BLOCKED' });
    expect(
      (
        await venueAdapter.searchMeetingSpaces(
          query,
          parseVenueFilters(new URLSearchParams()),
        )
      ).some((r) => r.space.id === context.space.id),
    ).toBe(false);
    setDemoOperationalBlock(context.space.resourceId, false);
    const [a, b] = await Promise.all([
      inquiryAdapter.submitVenueRequest(value.id, quote.id, 1, 'request', true),
      inquiryAdapter.submitVenueRequest(value.id, quote.id, 1, 'request', true),
    ]);
    expect(a.request!.id).toBe(b.request!.id);
    expect(b.requests).toHaveLength(1);
    expect(a.request!.status).toBe('submitted');
    expect(spaceAvailable(context.space, query, context.venue)).toBe(true);
    const contract = await inquiryAdapter.simulateSales(
      value.id,
      'accept_contract',
      'contract',
    );
    expect(contract.request!.status).toBe('accepted_for_contract');
    expect(contract.status).not.toBe('closed_won');
    expect(contract).not.toHaveProperty('payment');
    expect(contract).not.toHaveProperty('bookingStatus');
  });
  it('prevents another account or missing tab capability from viewing private inquiry and attachment data', async () => {
    await login();
    const id = await verified();
    signOutDemoAccount();
    await expect(inquiryAdapter.getInquiry(id)).rejects.toMatchObject({
      code: '401',
    });
    await login('other@example.com');
    await expect(inquiryAdapter.getInquiry(id)).rejects.toMatchObject({
      code: '403',
    });
    await expect(
      inquiryAdapter.getAttachment(id, 'fake'),
    ).rejects.toMatchObject({ code: '403' });
  });
  it('does not bind a guest inquiry when the account signs out while request submission is in flight', async () => {
    const value = await quoted();
    await login();
    const quote = value.quotes[0];
    const submission = inquiryAdapter.submitVenueRequest(
      value.id,
      quote.id,
      1,
      'request',
      true,
    );
    signOutDemoAccount();
    await expect(submission).rejects.toMatchObject({ code: '401' });
    expect((await inquiryAdapter.getInquiry(value.id)).request).toBeNull();
  });
  it('reconciles unknown mutation results by command ID without duplicate active leads or requests', async () => {
    await expect(
      inquiryAdapter.createInquiry(input, 'uncertain', [], 'mutation_timeout'),
    ).rejects.toMatchObject({ code: 'UNKNOWN' });
    const pending = await inquiryAdapter.resolveSubmission('uncertain');
    expect(pending).toBeTruthy();
    await inquiryAdapter.verifyInquiryContact(pending!.id, '123456');
    const quoted = await inquiryAdapter.simulateSales(
      pending!.id,
      'quote',
      'q',
    );
    await login();
    await expect(
      inquiryAdapter.submitVenueRequest(
        quoted.id,
        quoted.quotes[0].id,
        1,
        'unknown-request',
        true,
        'mutation_timeout',
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN' });
    const actual = await inquiryAdapter.getInquiry(quoted.id);
    expect(actual.request?.status).toBe('submitted');
    expect(actual.requests).toHaveLength(1);
  });
  it('keeps flexible events from request submission until needs and proposals are revalidated', async () => {
    const flexible = {
      ...input,
      event: { ...query, flexible: true, start: '', end: '' },
    };
    const value = await inquiryAdapter.createInquiry(flexible, 'flex');
    await inquiryAdapter.verifyInquiryContact(value.id, '123456');
    const q1 = await inquiryAdapter.simulateSales(value.id, 'quote', 'q1');
    await login();
    await expect(
      inquiryAdapter.submitVenueRequest(
        value.id,
        q1.quotes[0].id,
        1,
        'r',
        true,
      ),
    ).rejects.toMatchObject({ code: 'SCHEDULE' });
    const needs = await inquiryAdapter.reviseInquiryNeeds(
      value.id,
      query,
      'needs',
    );
    expect(needs.quotes[0].status).toBe('superseded');
    const q2 = await inquiryAdapter.simulateSales(value.id, 'quote', 'q2');
    const requested = await inquiryAdapter.submitVenueRequest(
      value.id,
      q2.quotes[1].id,
      2,
      'r2',
      true,
    );
    expect(requested.request?.event.flexible).toBe(false);
  });
  it('preserves quote and request snapshots when later proposals are revised', async () => {
    const value = await quoted();
    await login();
    const requested = await inquiryAdapter.submitVenueRequest(
      value.id,
      value.quotes[0].id,
      1,
      'r',
      true,
    );
    const revised = await inquiryAdapter.simulateSales(
      value.id,
      'quote',
      'revision',
    );
    expect(revised.request).toEqual(requested.request);
    expect(revised.requests[0].quoteVersion).toBe(1);
    expect(revised.quotes.at(-1)?.version).toBe(2);
  });
  it('checks file size, media signature and object ownership before reading attachment content', async () => {
    const forged = new File(['<html>fake</html>'], 'fake.pdf', {
      type: 'application/pdf',
    });
    await expect(validateInquiryFile(forged)).rejects.toMatchObject({
      code: 'FILE',
    });
    const file = new File(['%PDF-1.4\nExample file'], 'brief.pdf', {
      type: 'application/pdf',
    });
    await validateInquiryFile(file);
    const value = await inquiryAdapter.createInquiry(input, 'file', [file]);
    const downloaded = await inquiryAdapter.getAttachment(
      value.id,
      value.attachments[0].id,
    );
    expect(downloaded.name).toBe('brief.pdf');
    await expect(
      inquiryAdapter.getAttachment(value.id, 'foreign'),
    ).rejects.toMatchObject({ code: '403' });
  });
});
