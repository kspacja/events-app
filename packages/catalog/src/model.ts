import {
  brandedIdSchema,
  type Category,
  type EventId,
  type OccurrenceId,
  type Price,
} from '@events/contract/listing';
import { isWarsawIso } from '@events/time';

export type { Category, EventId, OccurrenceId, Price };

export const venueIdSchema = brandedIdSchema<'VenueId'>();
export type VenueId = ReturnType<typeof venueIdSchema.parse>;

export const venueId = (value: string): VenueId => venueIdSchema.parse(value);

export interface Venue {
  readonly id: VenueId;
  readonly name: string;
  readonly city: string;
  readonly location: { readonly lat: number; readonly lng: number };
}

export interface Event {
  readonly id: EventId;
  readonly title: string;
  readonly categorySlug: Category['slug'];
  readonly imageUrl?: string;
}

export interface Occurrence {
  readonly id: OccurrenceId;
  readonly eventId: EventId;
  readonly venueId: VenueId;
  /** Canonical Europe/Warsaw ISO, see `toWarsawIso`. */
  readonly startsAt: string;
  readonly price: Price | null;
}

// Venue.organizerId and Submission arrive with stages 1-2 (see docs/plans/stages/1-baza-i-katalog.md)
export interface CatalogData {
  readonly categories: readonly Category[];
  readonly venues: readonly Venue[];
  readonly events: readonly Event[];
  readonly occurrences: readonly Occurrence[];
}

export class CatalogIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogIntegrityError';
  }
}

export function indexBy<T>(items: readonly T[], keyOf: (item: T) => string): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [keyOf(item), item]));
}

export function lookup<T>(index: ReadonlyMap<string, T>, key: string, what: string): T {
  const found = index.get(key);
  if (!found) throw new CatalogIntegrityError(`Unknown ${what}: ${key}`);
  return found;
}

function assertUnique(kind: string, ids: readonly string[]): void {
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) throw new CatalogIntegrityError(`Duplicate ${kind} id: ${duplicate}`);
}

function assertIntegrity(data: CatalogData): void {
  assertUnique('category', data.categories.map(({ slug }) => slug));
  assertUnique('venue', data.venues.map(({ id }) => id));
  assertUnique('event', data.events.map(({ id }) => id));
  assertUnique('occurrence', data.occurrences.map(({ id }) => id));

  const slugs = indexBy(data.categories, ({ slug }) => slug);
  const venues = indexBy(data.venues, ({ id }) => id);
  const events = indexBy(data.events, ({ id }) => id);
  for (const { id, categorySlug } of data.events) lookup(slugs, categorySlug, `category of event ${id}`);
  for (const { id, eventId, venueId, startsAt } of data.occurrences) {
    lookup(events, eventId, `event of occurrence ${id}`);
    lookup(venues, venueId, `venue of occurrence ${id}`);
    if (!isWarsawIso(startsAt)) throw new CatalogIntegrityError(`Invalid startsAt of occurrence ${id}: ${startsAt}`);
  }
}

/** Opaque: the private constructor means only `createCatalog` can produce one, so integrity holds by construction. */
export class Catalog implements CatalogData {
  // A private member makes the type nominal: a spread or literal copy is not assignable
  declare private readonly validated: true;
  readonly categories: readonly Category[];
  readonly venues: readonly Venue[];
  readonly events: readonly Event[];
  readonly occurrences: readonly Occurrence[];

  private constructor({ categories, venues, events, occurrences }: CatalogData) {
    this.categories = categories;
    this.venues = venues;
    this.events = events;
    this.occurrences = occurrences;
  }

  static validated(data: CatalogData): Catalog {
    assertIntegrity(data);
    return new Catalog(data);
  }
}

/** Unique ids, resolving references and Warsaw ISO start times; throws CatalogIntegrityError otherwise. */
export function createCatalog(data: CatalogData): Catalog {
  return Catalog.validated(data);
}
