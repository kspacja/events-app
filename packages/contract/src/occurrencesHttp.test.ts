import { describe, expect, it } from 'vitest';
import {
  OCCURRENCES_QUERY_ERRORS,
  MAX_DAYS_PER_REQUEST,
  occurrencesQuerySchema,
  occurrencesResponseSchema,
} from './occurrencesHttp';
import { addDays } from '@events/time';

const FROM = '2030-03-01';

function errorOf(query: { from?: string; to?: string; forSchools?: string }) {
  const result = occurrencesQuerySchema.safeParse(query);
  return result.success ? null : result.error.issues[0].message;
}

describe('occurrencesQuerySchema', () => {
  it('accepts a single day and exactly the maximum range', () => {
    expect(occurrencesQuerySchema.safeParse({ from: FROM, to: FROM }).success).toBe(true);
    const to = addDays(FROM, MAX_DAYS_PER_REQUEST - 1);
    expect(occurrencesQuerySchema.safeParse({ from: FROM, to }).success).toBe(true);
  });

  it.each([
    ['too long', { from: FROM, to: addDays(FROM, MAX_DAYS_PER_REQUEST) }, OCCURRENCES_QUERY_ERRORS.tooLong],
    ['bad format', { from: '01-03-2030', to: FROM }, OCCURRENCES_QUERY_ERRORS.format],
    ['non-existent date', { from: '2026-02-30', to: '2026-03-01' }, OCCURRENCES_QUERY_ERRORS.format],
    ['from after to', { from: '2030-03-02', to: FROM }, OCCURRENCES_QUERY_ERRORS.order],
    ['missing', {}, OCCURRENCES_QUERY_ERRORS.missing],
    ['an unknown forSchools value', { from: FROM, to: FROM, forSchools: 'yes' }, OCCURRENCES_QUERY_ERRORS.forSchools],
  ])('rejects %s with its own error', (_name, query, message) => {
    expect(errorOf(query)).toBe(message);
  });
});

describe('occurrencesQuerySchema forSchools', () => {
  it.each([
    ['absent means the general programme', undefined, false],
    ['false', 'false', false],
    ['true', 'true', true],
  ])('reads %s', (_name, forSchools, expected) => {
    expect(occurrencesQuerySchema.parse({ from: FROM, to: FROM, forSchools }).forSchools).toBe(expected);
  });
});

describe('occurrencesResponseSchema', () => {
  const listing = {
    occurrenceId: 'concert-2030-03-01',
    startsAt: '2030-03-01T19:00:00+01:00',
    price: null,
    event: { id: 'concert', title: 'Koncert', categories: [{ slug: 'music', label: 'Muzyka' }], forSchools: false },
    venue: { name: 'Klub', address: 'ul. Mazowiecka 12', city: 'Warszawa', lat: 52.2, lng: 21 },
  };

  it('accepts a valid payload', () => {
    expect(occurrencesResponseSchema.safeParse({ occurrences: [listing] }).success).toBe(true);
  });

  it('rejects a payload without the occurrences wrapper', () => {
    expect(occurrencesResponseSchema.safeParse([listing]).success).toBe(false);
  });

  it('rejects an invalid listing inside the wrapper', () => {
    const body = { occurrences: [{ ...listing, startsAt: '2030-03-01T18:00:00Z' }] };
    expect(occurrencesResponseSchema.safeParse(body).success).toBe(false);
  });
});
