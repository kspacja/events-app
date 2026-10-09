import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema, occurrenceListingSchema } from '@events/contract/listing';
import { createEventsData, venueId } from './model';
import { toListings } from './listings';

const VENUE = { id: venueId('hall'), name: 'Hala', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const EVENT = {
  id: eventIdSchema.parse('jazz'),
  title: 'Jazz',
  categorySlug: 'music',
  imageUrl: '/jazz.jpg',
};

const data = createEventsData({
  categories: [{ slug: 'music', label: 'Muzyka' }],
  venues: [VENUE],
  events: [EVENT],
  occurrences: [
    {
      id: occurrenceIdSchema.parse('late'),
      eventId: EVENT.id,
      venueId: VENUE.id,
      startsAt: '2030-01-09T10:00:00+01:00',
      price: { kind: 'free' },
    },
    {
      id: occurrenceIdSchema.parse('early'),
      eventId: EVENT.id,
      venueId: VENUE.id,
      startsAt: '2030-01-01T10:00:00+01:00',
      price: null,
    },
  ],
});

describe('toListings', () => {
  it('joins event, category and venue into a schema-valid listing', () => {
    const [, listing] = toListings(data);

    expect(listing).toEqual({
      occurrenceId: 'early',
      startsAt: '2030-01-01T10:00:00+01:00',
      price: null,
      event: { id: 'jazz', title: 'Jazz', category: { slug: 'music', label: 'Muzyka' }, imageUrl: '/jazz.jpg' },
      venue: { name: 'Hala', city: 'Wrocław', lat: 51.1, lng: 17 },
    });
    expect(occurrenceListingSchema.safeParse(listing).success).toBe(true);
  });

  it('lists every occurrence in input order', () => {
    expect(toListings(data).map(({ occurrenceId }) => occurrenceId)).toEqual(['late', 'early']);
  });
});
