import { describe, expect, it } from 'vitest';
import {
  OCCURRENCES_QUERY_ERRORS,
  MAX_DAYS_PER_REQUEST,
  occurrencesQuerySchema,
  occurrencesResponseSchema,
  eventIdSchema,
  occurrenceIdSchema,
  priceSchema,
} from './occurrences';
import { addDays } from '@events/time';

const FROM = '2030-03-01';

function errorOf(query: { from?: string; to?: string }) {
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
  ])('rejects %s with its own error', (_name, query, message) => {
    expect(errorOf(query)).toBe(message);
  });
});

describe('priceSchema', () => {
  it.each([
    ['free', { kind: 'free' }],
    ['paid without an upper bound', { kind: 'paid', from: 20, currency: 'PLN' }],
    ['paid with an upper bound', { kind: 'paid', from: 20, to: 60, currency: 'PLN' }],
  ])('accepts a %s price', (_name, price) => {
    expect(priceSchema.safeParse(price).success).toBe(true);
  });

  it('rejects a paid price without a lower bound', () => {
    expect(priceSchema.safeParse({ kind: 'paid', currency: 'PLN' }).success).toBe(false);
  });

  it('rejects an unknown currency', () => {
    expect(priceSchema.safeParse({ kind: 'paid', from: 20, currency: 'EUR' }).success).toBe(false);
  });
});

describe('occurrencesResponseSchema', () => {
  const listing = {
    occurrenceId: 'concert-2030-03-01',
    startsAt: '2030-03-01T19:00:00+01:00',
    price: null,
    event: { id: 'concert', title: 'Koncert', category: 'music' },
    venue: { name: 'Klub', city: 'Warszawa', lat: 52.2, lng: 21 },
  };

  it('accepts a valid payload, with or without a price', () => {
    const priced = { ...listing, price: { kind: 'free' } };
    expect(occurrencesResponseSchema.safeParse({ occurrences: [listing, priced] }).success).toBe(true);
  });

  it('accepts price null as the "not provided" state', () => {
    const parsed = occurrencesResponseSchema.safeParse({ occurrences: [listing] });

    expect(parsed.success && parsed.data.occurrences[0].price).toBeNull();
    expect(priceSchema.safeParse(null).success).toBe(false);
  });

  it('rejects an unknown category', () => {
    const body = { occurrences: [{ ...listing, event: { ...listing.event, category: 'sports' } }] };
    expect(occurrencesResponseSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a missing venue', () => {
    const { occurrenceId, startsAt, price, event } = listing;
    const body = { occurrences: [{ occurrenceId, startsAt, price, event }] };
    expect(occurrencesResponseSchema.safeParse(body).success).toBe(false);
  });
});

describe.each([
  ['occurrenceIdSchema', occurrenceIdSchema],
  ['eventIdSchema', eventIdSchema],
])('%s', (_name, schema) => {
  it.each(['wro-choir', 'concert_2030-03-01', '01HZX3K9QJ'])('accepts %s', (id) => {
    expect(schema.safeParse(id).success).toBe(true);
  });

  it.each(['', 'two words', 'a"b', "a'b", 'a<b>', 'a\nb'])('rejects %j', (id) => {
    expect(schema.safeParse(id).success).toBe(false);
  });
});
