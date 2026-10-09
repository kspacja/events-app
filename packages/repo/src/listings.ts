import type { OccurrenceListing } from '@events/contract/listing';
import { indexBy, lookup, type EventsData } from './model';

/** Joins every occurrence with its event, category and venue; no range filter, no ordering. */
export function toListings(data: EventsData): OccurrenceListing[] {
  const categories = indexBy(data.categories, ({ slug }) => slug);
  const venues = indexBy(data.venues, ({ id }) => id);
  const events = indexBy(data.events, ({ id }) => id);

  return data.occurrences.map((occurrence): OccurrenceListing => {
    const { categorySlug, ...event } = lookup(events, occurrence.eventId, 'event');
    const venue = lookup(venues, occurrence.venueId, 'venue');
    return {
      occurrenceId: occurrence.id,
      startsAt: occurrence.startsAt,
      price: occurrence.price,
      event: { ...event, category: lookup(categories, categorySlug, 'category') },
      venue: {
        name: venue.name,
        city: venue.city,
        lat: venue.location.lat,
        lng: venue.location.lng,
      },
    };
  });
}
