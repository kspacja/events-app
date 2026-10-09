import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/listing';
import { createEventsData, createSampleEvents, venueId, type Price } from '@events/repo';
import { toSeedRows } from './seedRows';

const VENUE = { id: venueId('hall'), name: 'Hala', address: 'ul. Wystawowa 1', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const EVENT = { id: eventIdSchema.parse('jazz'), title: 'Jazz', categorySlugs: ['art', 'music'] };

function dataWithPrice(price: Price | null) {
  return createEventsData({
    categories: [
      { slug: 'music', label: 'Muzyka' },
      { slug: 'art', label: 'Sztuka' },
    ],
    venues: [VENUE],
    events: [EVENT],
    occurrences: [
      {
        id: occurrenceIdSchema.parse('jazz-2030-01-01'),
        eventId: EVENT.id,
        venueId: VENUE.id,
        startsAt: '2030-01-01T19:00:00+01:00',
        price,
      },
    ],
  });
}

describe('toSeedRows', () => {
  it.each([
    ['no price', null, { priceKind: null, priceFrom: null, priceTo: null, priceCurrency: null }],
    ['a free price', { kind: 'free' }, { priceKind: 'free', priceFrom: null, priceTo: null, priceCurrency: null }],
    [
      'a paid price',
      { kind: 'paid', from: 40, to: 80, currency: 'PLN' },
      { priceKind: 'paid', priceFrom: 40, priceTo: 80, priceCurrency: 'PLN' },
    ],
  ] as const)('spreads %s over the price columns', (_name, price, columns) => {
    const [occurrence] = toSeedRows(dataWithPrice(price)).occurrences;

    expect(occurrence).toMatchObject(columns);
  });

  it('stores the start as the same instant', () => {
    const [occurrence] = toSeedRows(dataWithPrice(null)).occurrences;

    expect(occurrence.startsAt).toEqual(new Date('2030-01-01T18:00:00Z'));
  });

  it('keeps the category order as position, the main category first', () => {
    expect(toSeedRows(dataWithPrice(null)).eventCategories).toEqual([
      { eventId: 'jazz', categorySlug: 'art', position: 0 },
      { eventId: 'jazz', categorySlug: 'music', position: 1 },
    ]);
  });

  it('turns a missing image into null', () => {
    expect(toSeedRows(dataWithPrice(null)).events).toEqual([{ id: 'jazz', title: 'Jazz', imageUrl: null }]);
  });

  it('has one row per sample record', () => {
    const data = createSampleEvents(new Date('2030-01-09T12:00:00Z'));
    const rows = toSeedRows(data);
    const assignments = data.events.reduce((sum, { categorySlugs }) => sum + categorySlugs.length, 0);

    expect(rows.categories).toHaveLength(data.categories.length);
    expect(rows.venues).toHaveLength(data.venues.length);
    expect(rows.events).toHaveLength(data.events.length);
    expect(rows.eventCategories).toHaveLength(assignments);
    expect(rows.occurrences).toHaveLength(data.occurrences.length);
  });
});
