import { sql } from 'drizzle-orm';
import { check, doublePrecision, index, numeric, pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

// One Postgres schema per context (ADR-0002)
export const eventsSchema = pgSchema('events');

export const priceKind = eventsSchema.enum('price_kind', ['free', 'paid']);

export const categories = eventsSchema.table('categories', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
});

export const venues = eventsSchema.table('venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
});

export const events = eventsSchema.table('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  categorySlug: text('category_slug')
    .notNull()
    .references(() => categories.slug),
  imageUrl: text('image_url'),
});

export const occurrences = eventsSchema.table(
  'occurrences',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id),
    venueId: text('venue_id')
      .notNull()
      .references(() => venues.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    // No price kind means the organizer did not give a price
    priceKind: priceKind('price_kind'),
    priceFrom: numeric('price_from', { precision: 10, scale: 2, mode: 'number' }),
    priceTo: numeric('price_to', { precision: 10, scale: 2, mode: 'number' }),
    priceCurrency: text('price_currency'),
  },
  (table) => [
    index('occurrences_starts_at_idx').on(table.startsAt),
    check(
      'occurrences_price_valid',
      sql`(${table.priceKind} IS DISTINCT FROM 'paid'
          AND ${table.priceFrom} IS NULL AND ${table.priceTo} IS NULL AND ${table.priceCurrency} IS NULL)
        OR (${table.priceKind} = 'paid'
          AND ${table.priceFrom} IS NOT NULL AND ${table.priceFrom} >= 0 AND ${table.priceCurrency} IS NOT DISTINCT FROM 'PLN'
          AND (${table.priceTo} IS NULL OR ${table.priceTo} >= ${table.priceFrom}))`,
    ),
  ],
);
