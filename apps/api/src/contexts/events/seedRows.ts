import type { EventsData, Price } from '@events/repo';
import type { categories, eventCategories, events, occurrences, venues } from './schema';

export interface EventsSeedRows {
  readonly categories: (typeof categories.$inferInsert)[];
  readonly venues: (typeof venues.$inferInsert)[];
  readonly events: (typeof events.$inferInsert)[];
  readonly eventCategories: (typeof eventCategories.$inferInsert)[];
  readonly occurrences: (typeof occurrences.$inferInsert)[];
}

type PriceColumns = Pick<
  typeof occurrences.$inferInsert,
  'priceKind' | 'priceFrom' | 'priceTo' | 'priceCurrency'
>;

function priceColumns(price: Price | null): PriceColumns {
  if (price === null) return { priceKind: null, priceFrom: null, priceTo: null, priceCurrency: null };
  if (price.kind === 'free') return { priceKind: 'free', priceFrom: null, priceTo: null, priceCurrency: null };
  return { priceKind: 'paid', priceFrom: price.from, priceTo: price.to, priceCurrency: price.currency };
}

/** Rows for the `events` schema; category order becomes `position`, so the main category is 0. */
export function toSeedRows(data: EventsData): EventsSeedRows {
  return {
    categories: data.categories.map(({ slug, label }) => ({ slug, label })),
    venues: data.venues.map(({ id, name, address, city, location }) => ({
      id,
      name,
      address,
      city,
      lat: location.lat,
      lng: location.lng,
    })),
    events: data.events.map(({ id, title, imageUrl }) => ({ id, title, imageUrl: imageUrl ?? null })),
    eventCategories: data.events.flatMap(({ id, categorySlugs }) =>
      categorySlugs.map((categorySlug, position) => ({ eventId: id, categorySlug, position })),
    ),
    occurrences: data.occurrences.map(({ id, eventId, venueId, startsAt, price }) => ({
      id,
      eventId,
      venueId,
      startsAt: new Date(startsAt),
      ...priceColumns(price),
    })),
  };
}
