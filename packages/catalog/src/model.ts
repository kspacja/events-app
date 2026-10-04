import type { Category, Price } from '@events/contract/listing';
import type { EventId, OccurrenceId } from '@events/contract/listing';

export type { Category, EventId, OccurrenceId, Price };

const VENUE_ID_FORMAT = /^[A-Za-z0-9_-]+$/;

export type VenueId = string & { readonly __brand: 'VenueId' };

export function venueId(value: string): VenueId {
  if (!VENUE_ID_FORMAT.test(value)) throw new Error(`Invalid venue id: "${value}"`);
  return value as VenueId;
}

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
export interface Catalog {
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

function assertUnique(kind: string, ids: readonly string[]): void {
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) throw new CatalogIntegrityError(`Duplicate ${kind} id: ${duplicate}`);
}

function assertKnown(kind: string, id: string, known: ReadonlySet<string>): void {
  if (!known.has(id)) throw new CatalogIntegrityError(`Unknown ${kind}: ${id}`);
}

/** Returns the catalog if ids are unique and every reference resolves; throws CatalogIntegrityError otherwise. */
export function createCatalog(catalog: Catalog): Catalog {
  assertUnique('category', catalog.categories.map(({ slug }) => slug));
  assertUnique('venue', catalog.venues.map(({ id }) => id));
  assertUnique('event', catalog.events.map(({ id }) => id));
  assertUnique('occurrence', catalog.occurrences.map(({ id }) => id));

  const slugs = new Set(catalog.categories.map(({ slug }) => slug));
  const venueIds = new Set<string>(catalog.venues.map(({ id }) => id));
  const eventIds = new Set<string>(catalog.events.map(({ id }) => id));
  for (const { id, categorySlug } of catalog.events) assertKnown(`category of event ${id}`, categorySlug, slugs);
  for (const { id, eventId, venueId } of catalog.occurrences) {
    assertKnown(`event of occurrence ${id}`, eventId, eventIds);
    assertKnown(`venue of occurrence ${id}`, venueId, venueIds);
  }
  return catalog;
}
