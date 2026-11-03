import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SEARCH,
  searchSchema,
  serializeSearch,
  restoreSearch,
  type SearchValues,
} from './search';
const valid: SearchValues = {
  ...DEFAULT_SEARCH,
  locationId: 'bali',
  start: '2099-12-10',
  end: '2099-12-12',
};
describe('Category search contract', () => {
  it('rejects unselected location and incomplete child ages', () => {
    expect(
      searchSchema('hotel').safeParse({ ...valid, locationId: 'Bali' }).success,
    ).toBe(false);
    expect(
      searchSchema('hotel').safeParse({
        ...valid,
        children: 2,
        childAges: ['5', ''],
      }).success,
    ).toBe(false);
  });
  it('requires a later check-out and rejects a past date', () => {
    expect(
      searchSchema('hotel').safeParse({ ...valid, end: valid.start }).success,
    ).toBe(false);
    expect(
      searchSchema('home').safeParse({ ...valid, start: '2000-01-01' }).success,
    ).toBe(false);
  });
  it('isolates car fields from hotel and preserves the full rental interval', () => {
    const data = {
      ...valid,
      pickup: 'Bandara',
      startTime: '09:00',
      endTime: '10:00',
    };
    const url = new URL(serializeSearch('car', data), 'http://localhost');
    expect(url.searchParams.has('rooms')).toBe(false);
    expect(url.searchParams.has('adults')).toBe(false);
    expect(url.searchParams.get('endTime')).toBe('10:00');
    expect(
      searchSchema('car').safeParse({
        ...data,
        end: data.start,
        endTime: '08:00',
      }).success,
    ).toBe(false);
  });
  it('omits return date for one-way and rejects identical airports', () => {
    const flight = { ...valid, locationId: 'CGK', destinationId: 'CGK' };
    expect(searchSchema('flight').safeParse(flight).success).toBe(false);
    const url = new URL(
      serializeSearch('flight', { ...flight, destinationId: 'DPS' }),
      'http://localhost',
    );
    expect(url.searchParams.has('end')).toBe(false);
    expect(url.searchParams.has('rooms')).toBe(false);
  });
  it('accepts a flexible venue request without a date', () => {
    expect(
      searchSchema('mice').safeParse({
        ...valid,
        start: '',
        end: '',
        flexible: true,
      }).success,
    ).toBe(true);
    expect(
      new URL(
        serializeSearch('mice', { ...valid, flexible: true }),
        'http://localhost',
      ).searchParams.has('start'),
    ).toBe(false);
  });
  it('round-trips hotel parameters and clamps invalid URL counts', () => {
    const data = { ...valid, children: 2, childAges: ['3', '8'], rooms: 2 };
    const restored = restoreSearch(
      new URL(serializeSearch('hotel', data), 'http://localhost').searchParams,
    );
    expect(restored.childAges).toEqual(['3', '8']);
    expect(restored.rooms).toBe(2);
    expect(
      restoreSearch(new URLSearchParams('adults=-5&rooms=999')).adults,
    ).toBe(2);
  });
});
