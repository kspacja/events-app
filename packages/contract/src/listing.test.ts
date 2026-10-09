import { describe, expect, it } from 'vitest';
import {
  categorySchema,
  eventIdSchema,
  occurrenceIdSchema,
  occurrenceListingSchema,
  priceSchema,
  startsAtSchema,
} from './listing';

describe('priceSchema', () => {
  it.each([
    ['free', { kind: 'free' }],
    ['paid without an upper bound', { kind: 'paid', from: 20, to: null, currency: 'PLN' }],
    ['paid with an upper bound', { kind: 'paid', from: 20, to: 60, currency: 'PLN' }],
  ])('accepts a %s price', (_name, price) => {
    expect(priceSchema.safeParse(price).success).toBe(true);
  });

  it('requires "to" to be explicit, so JSON and in-process values match', () => {
    expect(priceSchema.safeParse({ kind: 'paid', from: 20, currency: 'PLN' }).success).toBe(false);
  });

  it('rejects a paid price whose upper bound is below the lower one', () => {
    expect(priceSchema.safeParse({ kind: 'paid', from: 40, to: 30, currency: 'PLN' }).success).toBe(false);
  });

  it('rejects a paid price without a lower bound', () => {
    expect(priceSchema.safeParse({ kind: 'paid', to: null, currency: 'PLN' }).success).toBe(false);
  });

  it('rejects an unknown currency', () => {
    expect(
      priceSchema.safeParse({ kind: 'paid', from: 20, to: null, currency: 'EUR' }).success,
    ).toBe(false);
  });
});

describe('categorySchema', () => {
  it.each(['music', 'street-food', 'a1'])('accepts the slug %s, including ones not known in advance', (slug) => {
    expect(categorySchema.safeParse({ slug, label: 'Etykieta' }).success).toBe(true);
  });

  it.each(['', 'Music', 'two words', 'a_b', '-a', 'a-', 'a"b'])('rejects the slug %j', (slug) => {
    expect(categorySchema.safeParse({ slug, label: 'Etykieta' }).success).toBe(false);
  });

  it('rejects an empty label', () => {
    expect(categorySchema.safeParse({ slug: 'music', label: '' }).success).toBe(false);
  });
});

describe('startsAtSchema', () => {
  it.each(['2030-03-01T19:00:00+01:00', '2030-07-01T19:00:00+02:00'])('accepts %s', (value) => {
    expect(startsAtSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['UTC "Z"', '2030-03-01T18:00:00Z'],
    ['no offset', '2030-03-01T19:00:00'],
    ['a wrong Warsaw offset', '2030-07-01T19:00:00+01:00'],
    ['a foreign offset', '2030-03-01T19:00:00+00:00'],
    ['milliseconds', '2030-03-01T19:00:00.000+01:00'],
    ['not a date', 'tomorrow'],
  ])('rejects %s', (_name, value) => {
    expect(startsAtSchema.safeParse(value).success).toBe(false);
  });
});

describe('occurrenceListingSchema', () => {
  const listing = {
    occurrenceId: 'concert-2030-03-01',
    startsAt: '2030-03-01T19:00:00+01:00',
    price: null,
    event: { id: 'concert', title: 'Koncert', categories: [{ slug: 'music', label: 'Muzyka' }] },
    venue: { name: 'Klub', address: 'ul. Mazowiecka 12', city: 'Warszawa', lat: 52.2, lng: 21 },
  };

  it('accepts a listing with or without a price', () => {
    const priced = { ...listing, price: { kind: 'free' } };
    expect(occurrenceListingSchema.safeParse(listing).success).toBe(true);
    expect(occurrenceListingSchema.safeParse(priced).success).toBe(true);
  });

  it('keeps price null as the "not provided" state', () => {
    const parsed = occurrenceListingSchema.safeParse(listing);

    expect(parsed.success && parsed.data.price).toBeNull();
    expect(priceSchema.safeParse(null).success).toBe(false);
  });

  it('rejects a category given as a bare slug', () => {
    const body = { ...listing, event: { ...listing.event, categories: ['music'] } };
    expect(occurrenceListingSchema.safeParse(body).success).toBe(false);
  });

  it('requires at least one category', () => {
    const body = { ...listing, event: { ...listing.event, categories: [] } };
    expect(occurrenceListingSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a venue without an address', () => {
    const body = { ...listing, venue: { ...listing.venue, address: '' } };
    expect(occurrenceListingSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a missing venue', () => {
    const { occurrenceId, startsAt, price, event } = listing;
    expect(occurrenceListingSchema.safeParse({ occurrenceId, startsAt, price, event }).success).toBe(false);
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
