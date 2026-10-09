import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  numeric,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

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
  // Street and number; the city is a separate column
  address: text('address').notNull(),
  city: text('city').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
});

export const events = eventsSchema.table('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  // Oznaczenie szkolne: such events are left out of the general programme
  forSchools: boolean('for_schools').notNull().default(false),
});

// An event has one or more categories; position 0 is the main one
export const eventCategories = eventsSchema.table(
  'event_categories',
  {
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade', onUpdate: 'restrict' }),
    // A renamed slug follows into event_categories; a category in use cannot be deleted
    categorySlug: text('category_slug')
      .notNull()
      .references(() => categories.slug, { onDelete: 'restrict', onUpdate: 'cascade' }),
    position: smallint('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.categorySlug] }),
    unique('event_categories_event_position_unique').on(table.eventId, table.position),
    index('event_categories_category_slug_idx').on(table.categorySlug),
    check('event_categories_position_valid', sql`${table.position} >= 0`),
  ],
);

export const occurrences = eventsSchema.table(
  'occurrences',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade', onUpdate: 'restrict' }),
    venueId: text('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict', onUpdate: 'restrict' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    // No price kind means the organizer did not give a price
    priceKind: priceKind('price_kind'),
    priceFrom: numeric('price_from', { precision: 10, scale: 2, mode: 'number' }),
    priceTo: numeric('price_to', { precision: 10, scale: 2, mode: 'number' }),
    priceCurrency: text('price_currency'),
  },
  (table) => [
    index('occurrences_starts_at_idx').on(table.startsAt),
    index('occurrences_event_id_idx').on(table.eventId),
    index('occurrences_venue_id_idx').on(table.venueId),
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
