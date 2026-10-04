import type { OccurrenceListing } from '@events/contract/listing';
import { createCatalog, venueId, type Catalog, type Event, type Venue } from './model';

const venueKey = ({ name, city, lat, lng }: OccurrenceListing['venue']) =>
  `${name}|${city}|${lat}|${lng}`;

/** Test helper: derives a Catalog that projects back to exactly these listings (venues deduped by value). */
export function catalogFromListings(listings: readonly OccurrenceListing[]): Catalog {
  const categories = new Map(listings.map(({ event }) => [event.category.slug, event.category]));
  const events = new Map<string, Event>();
  const venues = new Map<string, Venue>();

  const venueOf = (venue: OccurrenceListing['venue']): Venue => {
    const key = venueKey(venue);
    const known = venues.get(key);
    if (known) return known;
    const created: Venue = {
      id: venueId(`venue-${venues.size}`),
      name: venue.name,
      city: venue.city,
      location: { lat: venue.lat, lng: venue.lng },
    };
    venues.set(key, created);
    return created;
  };

  const occurrences = listings.map(({ occurrenceId, event, venue, startsAt, price }) => {
    if (!events.has(event.id)) {
      events.set(event.id, {
        id: event.id,
        title: event.title,
        categorySlug: event.category.slug,
        ...(event.imageUrl === undefined ? {} : { imageUrl: event.imageUrl }),
      });
    }
    return { id: occurrenceId, eventId: event.id, venueId: venueOf(venue).id, startsAt, price };
  });

  return createCatalog({
    categories: [...categories.values()],
    venues: [...venues.values()],
    events: [...events.values()],
    occurrences,
  });
}
