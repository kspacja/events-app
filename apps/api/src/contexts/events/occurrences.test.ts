import { describe, expect, it } from 'vitest';
import { OCCURRENCE_ROW } from './occurrenceRow.testing';
import { toListing } from './occurrences';

const MUSIC = { slug: 'music', label: 'Muzyka' };

describe('toListing', () => {
  it('builds a contract listing with the start in Warsaw time', () => {
    expect(toListing(OCCURRENCE_ROW, [MUSIC])).toEqual({
      occurrenceId: 'jazz-2030-01-01',
      startsAt: '2030-01-01T19:00:00+01:00',
      price: null,
      event: { id: 'jazz', title: 'Jazz', categories: [MUSIC], forSchools: false },
      venue: { name: 'Hala', address: 'ul. Wystawowa 1', city: 'Wrocław', lat: 51.1, lng: 17 },
    });
  });

  it.each([
    ['a free price', { priceKind: 'free' as const }, { kind: 'free' }],
    [
      'a paid price',
      { priceKind: 'paid' as const, priceFrom: 40, priceTo: null, priceCurrency: 'PLN' },
      { kind: 'paid', from: 40, to: null, currency: 'PLN' },
    ],
  ])('reads %s from the price columns', (_name, columns, price) => {
    expect(toListing({ ...OCCURRENCE_ROW, ...columns }, [MUSIC]).price).toEqual(price);
  });

  it('keeps an image and the given category order', () => {
    const art = { slug: 'art', label: 'Sztuka' };
    const listing = toListing({ ...OCCURRENCE_ROW, imageUrl: '/jazz.jpg' }, [art, MUSIC]);

    expect(listing.event).toEqual({
      id: 'jazz',
      title: 'Jazz',
      categories: [art, MUSIC],
      imageUrl: '/jazz.jpg',
      forSchools: false,
    });
  });

  it('rejects data the contract forbids, such as an event without a category', () => {
    expect(() => toListing(OCCURRENCE_ROW, [])).toThrow();
  });
});
