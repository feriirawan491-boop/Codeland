import { beforeEach, describe, expect, it } from 'vitest';
import {
  signOutDemoAccount,
  verifyDemoAccount,
} from '@/features/account/lib/demo-auth';
import { venueAdapter } from '@/features/venue/lib/adapter';
import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import { packageEstimate } from '@/features/venue/lib/pricing';
import {
  setDemoOperationalBlock,
  spaceAvailable,
} from '@/features/venue/lib/resources';
import { inquiryInputSchema } from '@/features/venue/lib/inquiry-schema';
import type { InquiryInput } from '@/features/venue/lib/types';
import type { WeddingQuery } from '@/features/venue/lib/wedding-types';
import { weddingAdapter } from './adapter';
import {
  parseWeddingQuery,
  weddingParams,
  parseWeddingFilters,
  weddingQuerySchema,
  weddingRequirementsSchema,
} from './query';
const query: WeddingQuery = {
  locationId: 'jakarta',
  start: '2099-12-10',
  end: '2099-12-10',
  startTime: '09:00',
  endTime: '17:00',
  flexible: false,
  participants: 100,
  layout: 'banquet',
  eventType: 'gathering',
};
const wedding = {
  alternativeDates: ['2099-12-11'],
  siteVisit: true,
  siteVisitDate: '2099-12-01',
  ceremony: 'both' as const,
  decoration: true,
};
const input: InquiryInput = {
  service: 'wedding',
  spaceId: 'asmara-grand',
  packageId: 'asmara-grand-wedding-venue',
  event: query,
  contact: {
    name: 'Wedding Couple',
    email: 'couple@example.com',
    phone: '081234567890',
    company: '',
  },
  needs: { av: false, catering: true, rooms: 0, notes: '' },
  wedding,
  consent: true,
};
const login = (email = 'couple@example.com') =>
  verifyDemoAccount(
    'register',
    { name: 'Wedding Couple', email, phone: '081234567890' },
    '123456',
  );
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  signOutDemoAccount();
});
describe('Wedding search and package meaning', () => {
  it('maps seated URLs, strips flexible dates and validates hours and distinct alternative dates', () => {
    expect(parseWeddingQuery(weddingParams(query))).toEqual(query);
    expect(weddingParams({ ...query, flexible: true }).has('start')).toBe(
      false,
    );
    expect(
      weddingQuerySchema.safeParse({ ...query, startTime: '07:00' }).success,
    ).toBe(false);
    expect(
      weddingQuerySchema.safeParse({ ...query, end: '2099-12-11' }).success,
    ).toBe(false);
    expect(
      weddingRequirementsSchema.safeParse({
        ...wedding,
        alternativeDates: ['2099-02-30'],
      }).success,
    ).toBe(false);
    expect(
      weddingRequirementsSchema.safeParse({
        ...wedding,
        alternativeDates: ['2099-12-11', '2099-12-11'],
      }).success,
    ).toBe(false);
    expect(
      weddingRequirementsSchema.parse({ ...wedding, siteVisit: false })
        .siteVisitDate,
    ).toBe('');
    expect(inquiryInputSchema.safeParse(input).success).toBe(true);
    expect(
      inquiryInputSchema.safeParse({
        ...input,
        wedding: { ...wedding, alternativeDates: [query.start] },
      }).success,
    ).toBe(false);
    expect(
      inquiryInputSchema.safeParse({ ...input, service: 'mice' }).success,
    ).toBe(false);
  });
  it('uses the requested seated or standing capacity, preserving shared MICE fixtures', async () => {
    const filters = parseWeddingFilters(new URLSearchParams());
    const seated = await weddingAdapter.searchWeddingVenues(
      { ...query, participants: 500 },
      filters,
    );
    const standing = await weddingAdapter.searchWeddingVenues(
      { ...query, participants: 500, layout: 'standing' },
      filters,
    );
    expect(seated.some((r) => r.space.id === 'asmara-garden')).toBe(false);
    expect(standing.some((r) => r.space.id === 'asmara-garden')).toBe(true);
    expect(seated.some((r) => r.space.id === 'asmara-grand')).toBe(true);
    expect(venueAdapter.getSpaceById('asmara-grand')).toBeNull();
    expect(
      venueAdapter.getSpaceById('cendana-hall')!.space.capacity.classroom,
    ).toBe(80);
  });
  it('keeps venue-only exclusions and unknown custom prices explicit; totals include minimums, tax and overtime', async () => {
    const { space } = await weddingAdapter.getWeddingVenue('asmara-grand');
    const [venue, inclusive, custom] = space.packages;
    expect(venue.wedding).toMatchObject({ catering: false, decoration: false });
    expect(custom.wedding).toMatchObject({
      catering: null,
      decoration: null,
      overtime: null,
    });
    expect(packageEstimate(custom, query)).toBeNull();
    const estimate = packageEstimate(inclusive, {
      ...query,
      participants: 30,
    })!;
    expect(estimate.belowMinimum).toBe(true);
    expect(estimate.overtime).toBe(inclusive.wedding!.overtime! * 2);
    expect(estimate.total).toBe(
      estimate.packageBase +
        estimate.overtime +
        estimate.tax +
        estimate.serviceFee,
    );
    const results = await weddingAdapter.searchWeddingVenues(query, {
      ...parseWeddingFilters(new URLSearchParams()),
      budget: 1,
    });
    expect(results).toHaveLength(0);
  });
});
describe('Wedding inquiry and request boundaries', () => {
  it('verifies contact and preserves wedding needs in immutable versioned quotes', async () => {
    const pending = await inquiryAdapter.createInquiry(input, 'lead');
    await expect(
      inquiryAdapter.simulateSales(pending.id, 'quote', 'q0'),
    ).rejects.toMatchObject({ code: 'UNVERIFIED' });
    await inquiryAdapter.verifyInquiryContact(pending.id, '123456');
    const value = await inquiryAdapter.simulateSales(pending.id, 'quote', 'q1');
    expect(value.wedding).toEqual(wedding);
    expect(value.quotes[0].wedding).toEqual(wedding);
    expect(value.quotes[0].packageSnapshot?.wedding?.catering).toBe(false);
    await login();
    await inquiryAdapter.simulateSales(value.id, 'quote', 'q2');
    await expect(
      inquiryAdapter.submitVenueRequest(
        value.id,
        value.quotes[0].id,
        1,
        'old',
        true,
      ),
    ).rejects.toMatchObject({ code: '409' });
    await inquiryAdapter.simulateSales(value.id, 'expire', 'expire');
    const expired = await inquiryAdapter.getInquiry(value.id);
    await expect(
      inquiryAdapter.submitVenueRequest(
        value.id,
        expired.quotes[1].id,
        2,
        'expired',
        true,
      ),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
    const refreshed = await inquiryAdapter.requestQuoteRefresh(
      value.id,
      'refresh',
    );
    expect(refreshed.quotes).toHaveLength(2);
    expect(refreshed.history.at(-1)?.label).toBeDefined();
  });
  it('requires login and consent for no-quote requests; preserves snapshots without price, hold or duplicate', async () => {
    const { service: _service, contact: _contact, ...request } = input;
    void _service;
    void _contact;
    await expect(
      inquiryAdapter.createWeddingRequest(request, 'req'),
    ).rejects.toMatchObject({ code: '401' });
    await login();
    await expect(
      inquiryAdapter.createWeddingRequest(
        { ...request, consent: false },
        'bad',
      ),
    ).rejects.toMatchObject({ code: 'CONSENT' });
    const [a, b] = await Promise.all([
      inquiryAdapter.createWeddingRequest(request, 'req'),
      inquiryAdapter.createWeddingRequest(request, 'req'),
    ]);
    expect(a.id).toBe(b.id);
    expect(a.request?.id).toBe(b.request?.id);
    expect(a.request).toMatchObject({
      status: 'submitted',
      quoteId: null,
      quoteVersion: null,
      total: null,
      wedding,
    });
    expect(a.quotes).toHaveLength(0);
    expect(a.requests).toHaveLength(1);
    const context = await weddingAdapter.getWeddingVenue('asmara-grand');
    expect(spaceAvailable(context.space, query, context.venue)).toBe(true);
    signOutDemoAccount();
    await login('other@example.com');
    await expect(inquiryAdapter.getInquiry(a.id)).rejects.toMatchObject({
      code: '403',
    });
  });
  it('uses the same physical resource as MICE and reconciles unknown submissions by command ID', async () => {
    const mice = venueAdapter.getSpaceById('amara-ballroom')!;
    const wed = await weddingAdapter.getWeddingVenue('amara-ballroom');
    expect(wed.space.resourceId).toBe(mice.space.resourceId);
    setDemoOperationalBlock(mice.space.resourceId, true);
    expect(
      spaceAvailable(wed.space, { ...query, locationId: 'bandung' }, wed.venue),
    ).toBe(false);
    setDemoOperationalBlock(wed.space.resourceId, false);
    expect(
      spaceAvailable(
        mice.space,
        { ...query, locationId: 'bandung' },
        mice.venue,
      ),
    ).toBe(true);
    await login();
    setDemoOperationalBlock(mice.space.resourceId, true);
    await expect(
      inquiryAdapter.createWeddingRequest(
        {
          spaceId: wed.space.id,
          packageId: wed.space.packages[0].id,
          event: { ...query, locationId: 'bandung' },
          needs: input.needs,
          wedding,
          consent: true,
        },
        'blocked-wedding',
      ),
    ).rejects.toMatchObject({ code: 'BLOCKED' });
    setDemoOperationalBlock(mice.space.resourceId, false);
    const { service: _s, contact: _c, ...request } = input;
    void _s;
    void _c;
    await expect(
      inquiryAdapter.createWeddingRequest(
        request,
        'unknown',
        'mutation_timeout',
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN' });
    const resolved = await inquiryAdapter.resolveSubmission('unknown:inquiry');
    expect(resolved?.request?.status).toBe('submitted');
    const retry = await inquiryAdapter.createWeddingRequest(request, 'unknown');
    expect(retry.requests).toHaveLength(1);
  });
});
