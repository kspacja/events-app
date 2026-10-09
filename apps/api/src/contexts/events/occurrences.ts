import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { occurrenceListingSchema, type Category, type OccurrenceListing } from '@events/contract/listing';
import { addDays, DAY_BOUNDARY_MINUTES, toWarsawIso, warsawIsoAt, type DateRange } from '@events/time';
import type { Db } from '../../db';
import { categories, eventCategories, events, occurrences, venues } from './schema';

export type ListOccurrences = (range: DateRange) => Promise<OccurrenceListing[]>;

export interface OccurrenceRow {
  readonly id: string;
  readonly startsAt: Date;
  readonly priceKind: 'free' | 'paid' | null;
  readonly priceFrom: number | null;
  readonly priceTo: number | null;
  readonly priceCurrency: string | null;
  readonly eventId: string;
  readonly title: string;
  readonly imageUrl: string | null;
  readonly venueName: string;
  readonly venueAddress: string;
  readonly venueCity: string;
  readonly lat: number;
  readonly lng: number;
}

/** Event days end at 04:00 Warsaw time, so the range runs from `from` 04:00 up to (not incl.) the day after `to` at 04:00. */
export function eventDayBounds(range: DateRange): { readonly start: Date; readonly end: Date } {
  return {
    start: new Date(warsawIsoAt(range.from, DAY_BOUNDARY_MINUTES)),
    end: new Date(warsawIsoAt(addDays(range.to, 1), DAY_BOUNDARY_MINUTES)),
  };
}

// Unchecked shape; toListing parses it against the contract
function priceOf(row: OccurrenceRow): object | null {
  if (row.priceKind === 'free') return { kind: 'free' };
  if (row.priceKind === 'paid') return { kind: 'paid', from: row.priceFrom, to: row.priceTo, currency: row.priceCurrency };
  return null;
}

/** Parsed against the contract, so data the database lets through but the contract forbids fails here, not in the portal. */
export function toListing(row: OccurrenceRow, eventCategoryList: readonly Category[]): OccurrenceListing {
  return occurrenceListingSchema.parse({
    occurrenceId: row.id,
    startsAt: toWarsawIso(row.startsAt),
    price: priceOf(row),
    event: {
      id: row.eventId,
      title: row.title,
      categories: eventCategoryList,
      ...(row.imageUrl === null ? {} : { imageUrl: row.imageUrl }),
    },
    venue: { name: row.venueName, address: row.venueAddress, city: row.venueCity, lat: row.lat, lng: row.lng },
  });
}

async function categoriesByEvent(db: Db, eventIds: readonly string[]): Promise<Map<string, Category[]>> {
  const byEvent = new Map<string, Category[]>();
  if (eventIds.length === 0) return byEvent;

  const rows = await db
    .select({ eventId: eventCategories.eventId, slug: categories.slug, label: categories.label })
    .from(eventCategories)
    .innerJoin(categories, eq(categories.slug, eventCategories.categorySlug))
    .where(inArray(eventCategories.eventId, [...eventIds]))
    .orderBy(asc(eventCategories.eventId), asc(eventCategories.position));

  for (const { eventId, slug, label } of rows) {
    const list = byEvent.get(eventId) ?? [];
    list.push({ slug, label });
    byEvent.set(eventId, list);
  }
  return byEvent;
}

// Ids sort bytewise (collate "C"), the same order as compareListings in the contract
export function createOccurrenceReader(db: Db): ListOccurrences {
  return async (range) => {
    const { start, end } = eventDayBounds(range);
    const rows = await db
      .select({
        id: occurrences.id,
        startsAt: occurrences.startsAt,
        priceKind: occurrences.priceKind,
        priceFrom: occurrences.priceFrom,
        priceTo: occurrences.priceTo,
        priceCurrency: occurrences.priceCurrency,
        eventId: events.id,
        title: events.title,
        imageUrl: events.imageUrl,
        venueName: venues.name,
        venueAddress: venues.address,
        venueCity: venues.city,
        lat: venues.lat,
        lng: venues.lng,
      })
      .from(occurrences)
      .innerJoin(events, eq(events.id, occurrences.eventId))
      .innerJoin(venues, eq(venues.id, occurrences.venueId))
      .where(and(gte(occurrences.startsAt, start), lt(occurrences.startsAt, end)))
      .orderBy(asc(occurrences.startsAt), asc(sql`${occurrences.id} collate "C"`));

    const byEvent = await categoriesByEvent(db, [...new Set(rows.map(({ eventId }) => eventId))]);
    return rows.map((row) => toListing(row, byEvent.get(row.eventId) ?? []));
  };
}
