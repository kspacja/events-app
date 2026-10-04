import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema, occurrenceListingSchema } from '@events/contract/listing';
import { createCatalog, venueId, type Catalog } from './model';
import { listOccurrences } from './listOccurrences';

const VENUE = { id: venueId('hall'), name: 'Hala', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const EVENT = {
  id: eventIdSchema.parse('jazz'),
  title: 'Jazz',
  categorySlug: 'music',
  imageUrl: '/jazz.jpg',
};
const occurrence = (id: string, startsAt: string, price: Catalog['occurrences'][number]['price'] = null) => ({
  id: occurrenceIdSchema.parse(id),
  eventId: EVENT.id,
  venueId: VENUE.id,
  startsAt,
  price,
});

const catalog = createCatalog({
  categories: [{ slug: 'music', label: 'Muzyka' }],
  venues: [VENUE],
  events: [EVENT],
  occurrences: [
    occurrence('b', '2030-01-02T19:00:00+01:00', { kind: 'free' }),
    occurrence('a', '2030-01-02T19:00:00+01:00'),
    occurrence('early', '2030-01-01T10:00:00+01:00'),
    occurrence('outside', '2030-01-09T10:00:00+01:00'),
  ],
});

describe('listOccurrences', () => {
  it('joins event, category and venue into a schema-valid listing', () => {
    const [listing] = listOccurrences(catalog, { from: '2030-01-01', to: '2030-01-01' });

    expect(listing).toEqual({
      occurrenceId: 'early',
      startsAt: '2030-01-01T10:00:00+01:00',
      price: null,
      event: { id: 'jazz', title: 'Jazz', category: { slug: 'music', label: 'Muzyka' }, imageUrl: '/jazz.jpg' },
      venue: { name: 'Hala', city: 'Wrocław', lat: 51.1, lng: 17 },
    });
    expect(occurrenceListingSchema.safeParse(listing).success).toBe(true);
  });

  it('keeps only event days in the inclusive range, sorted by startsAt then id', () => {
    const ids = listOccurrences(catalog, { from: '2030-01-01', to: '2030-01-02' }).map(
      ({ occurrenceId }) => occurrenceId,
    );

    expect(ids).toEqual(['early', 'a', 'b']);
  });

  it('counts an occurrence after midnight towards the previous event day', () => {
    const night = createCatalog({ ...catalog, occurrences: [occurrence('night', '2030-01-06T01:30:00+01:00')] });

    expect(listOccurrences(night, { from: '2030-01-05', to: '2030-01-05' })).toHaveLength(1);
    expect(listOccurrences(night, { from: '2030-01-06', to: '2030-01-06' })).toHaveLength(0);
  });

  it('throws on a reference the catalog does not resolve', () => {
    const dangling: Catalog = { ...catalog, venues: [] };

    expect(() => listOccurrences(dangling, { from: '2030-01-01', to: '2030-01-02' })).toThrow();
  });
});
