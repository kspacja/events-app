import { z } from 'zod';
import { isWarsawIso } from '@events/time';

// Ids end up in DOM ids and selectors, so only URL- and HTML-safe characters are allowed
const ID_FORMAT = /^[A-Za-z0-9_-]+$/;
// Slugs end up in CSS custom property names, so only lowercase words joined by hyphens
const CATEGORY_SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Shared id format, so every context's ids stay safe in DOM ids and URLs. */
export const brandedIdSchema = <Brand extends string>() =>
  z.string().regex(ID_FORMAT).brand<Brand>();

export const occurrenceIdSchema = brandedIdSchema<'OccurrenceId'>();
export const eventIdSchema = brandedIdSchema<'EventId'>();

export type OccurrenceId = z.infer<typeof occurrenceIdSchema>;
export type EventId = z.infer<typeof eventIdSchema>;

export const venueSchema = z
  .object({
    name: z.string(),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .readonly();

/** `to` is always present: a number, or null when there is no upper bound. */
export const priceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('free') }).readonly(),
  z
    .object({
      kind: z.literal('paid'),
      from: z.number().nonnegative(),
      to: z.number().nonnegative().nullable(),
      currency: z.literal('PLN'),
    })
    .readonly(),
]);

/** A managed list in the Catalog, so a new category must not break parsing. */
export const categorySchema = z
  .object({
    slug: z.string().regex(CATEGORY_SLUG_FORMAT),
    label: z.string().min(1),
  })
  .readonly();

/** Strict on purpose: canonical Warsaw ISO only (no Z, no millis, e.g. `2030-03-01T19:00:00+01:00`); adapters normalise with `toWarsawIso`. */
export const startsAtSchema = z.iso
  .datetime({ offset: true })
  .refine(isWarsawIso, { error: 'startsAt must be a Europe/Warsaw ISO string with its offset.' });

export const listedEventSchema = z
  .object({
    id: eventIdSchema,
    title: z.string(),
    category: categorySchema,
    imageUrl: z.string().optional(),
  })
  .readonly();

export const occurrenceListingSchema = z
  .object({
    occurrenceId: occurrenceIdSchema,
    startsAt: startsAtSchema,
    price: priceSchema.nullable(),
    event: listedEventSchema,
    venue: venueSchema,
  })
  .readonly();

export type Venue = z.infer<typeof venueSchema>;
export type Price = z.infer<typeof priceSchema>;
export type Category = z.infer<typeof categorySchema>;
export type OccurrenceListing = z.infer<typeof occurrenceListingSchema>;
