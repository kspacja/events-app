import type { OccurrenceListing } from '@events/contract/listing';
import { indexBy, lookup, type EventsData } from './model';

/** Joins every occurrence with its event, category and venue; no range filter, no ordering. */
export function toListings(data: EventsData): OccurrenceListing[] {
  const categories = indexBy(data.categories, ({ slug }) => slug);
  const venues = indexBy(data.venues, ({ id }) => id);
  const events = indexBy(data.events, ({ id }) => id);

  return data.occurrences.map((occurrence): OccurrenceListing => {
    const { categorySlugs, ...event } = lookup(events, occurrence.eventId, 'event');
    const venue = lookup(venues, occurrence.venueId, 'venue');
    return {
      occurrenceId: occurrence.id,
      startsAt: occurrence.startsAt,
      price: occurrence.price,
      event: { ...event, categories: categorySlugs.map((slug) => lookup(categories, slug, 'category')) },
      venue: {
        name: venue.name,
        address: venue.address,
        city: venue.city,
        lat: venue.location.lat,
        lng: venue.location.lng,
      },
    };
  });
}
