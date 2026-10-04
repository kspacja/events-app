import type { OccurrenceListing } from '@events/contract/listing';
import { compareListings } from '@events/contract/source';
import { eventDayOf, isDayInRange, type DateRange } from '@events/time';
import { CatalogIntegrityError, type Catalog } from './model';

function indexBy<T>(items: readonly T[], keyOf: (item: T) => string): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [keyOf(item), item]));
}

function lookup<T>(index: ReadonlyMap<string, T>, key: string, what: string): T {
  const found = index.get(key);
  if (!found) throw new CatalogIntegrityError(`Unknown ${what}: ${key}`);
  return found;
}

/** Projects the catalog onto the read model: event days in range, sorted, ids unique per catalog. */
export function listOccurrences(catalog: Catalog, range: DateRange): OccurrenceListing[] {
  const categories = indexBy(catalog.categories, ({ slug }) => slug);
  const venues = indexBy(catalog.venues, ({ id }) => id);
  const events = indexBy(catalog.events, ({ id }) => id);

  return catalog.occurrences
    .filter(({ startsAt }) => isDayInRange(eventDayOf(startsAt), range))
    .map((occurrence): OccurrenceListing => {
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
    })
    .sort(compareListings);
}
