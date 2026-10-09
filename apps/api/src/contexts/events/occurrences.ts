import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { occurrenceListingSchema, type Category, type OccurrenceListing } from '@events/contract/listing';
import { eventDayBounds, toWarsawIso, type DateRange } from '@events/time';
import type { Db } from '../../db';
import { categories, eventCategories, events, occurrences, venues } from './schema';

export interface OccurrencesQuery extends DateRange {
  readonly forSchools: boolean;
}

export type ListOccurrences = (query: OccurrencesQuery) => Promise<OccurrenceListing[]>;

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
  readonly forSchools: boolean;
  readonly venueName: string;
  readonly venueAddress: string;
  readonly venueCity: string;
  readonly lat: number;
  readonly lng: number;
}

// Unchecked shape; toListing parses it against the contract
function priceOf(row: OccurrenceRow): unknown {
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
      forSchools: row.forSchools,
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

export function createOccurrenceReader(db: Db): ListOccurrences {
  return async ({ forSchools, ...range }) => {
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
        forSchools: events.forSchools,
        venueName: venues.name,
        venueAddress: venues.address,
        venueCity: venues.city,
        lat: venues.lat,
        lng: venues.lng,
      })
      .from(occurrences)
      .innerJoin(events, eq(events.id, occurrences.eventId))
      .innerJoin(venues, eq(venues.id, occurrences.venueId))
      .where(and(gte(occurrences.startsAt, start), lt(occurrences.startsAt, end), eq(events.forSchools, forSchools)))
      // Ids sort bytewise (collate "C"), the same order as compareListings in the contract
      .orderBy(asc(occurrences.startsAt), asc(sql`${occurrences.id} collate "C"`));

    const byEvent = await categoriesByEvent(db, [...new Set(rows.map(({ eventId }) => eventId))]);
    // One bad row must not blank the whole programme: skip it and log why
    return rows.flatMap((row) => {
      try {
        return [toListing(row, byEvent.get(row.eventId) ?? [])];
      } catch (error: unknown) {
        console.error('Skipping an occurrence that breaks the contract', { occurrenceId: row.id, error });
        return [];
      }
    });
  };
}
