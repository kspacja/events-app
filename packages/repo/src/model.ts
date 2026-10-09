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
export type VenueId = ReturnType<typeof venueIdSchema.parse>; // repo has no direct zod dependency, so no z.infer

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

// Venue.organizerId arrives with stage 2, Submission with stage 3
export interface EventsDataInput {
  readonly categories: readonly Category[];
  readonly venues: readonly Venue[];
  readonly events: readonly Event[];
  readonly occurrences: readonly Occurrence[];
}

export class EventsIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventsIntegrityError';
  }
}

/** Package-internal: not re-exported from index.ts. */
export function indexBy<T>(items: readonly T[], keyOf: (item: T) => string): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [keyOf(item), item]));
}

/** Package-internal: not re-exported from index.ts. */
export function lookup<T>(index: ReadonlyMap<string, T>, key: string, what: string): T {
  const found = index.get(key);
  if (!found) throw new EventsIntegrityError(`Unknown ${what}: ${key}`);
  return found;
}

function assertUnique(kind: string, ids: readonly string[]): void {
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) throw new EventsIntegrityError(`Duplicate ${kind} id: ${duplicate}`);
}

function assertIntegrity(data: EventsDataInput): void {
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
    if (!isWarsawIso(startsAt)) throw new EventsIntegrityError(`Invalid startsAt of occurrence ${id}: ${startsAt}`);
  }
}

function freezeAll<T extends object>(items: readonly T[], copy: (item: T) => T = (item) => ({ ...item })): readonly T[] {
  return Object.freeze(items.map((item) => Object.freeze(copy(item))));
}

const copyVenue = (venue: Venue): Venue => ({ ...venue, location: Object.freeze({ ...venue.location }) });

const copyOccurrence = (occurrence: Occurrence): Occurrence => ({
  ...occurrence,
  price: occurrence.price && Object.freeze({ ...occurrence.price }),
});

/** Opaque: the brand makes the type nominal and index.ts exports it as a type only; build one with `createEventsData`. */
export class EventsData implements EventsDataInput {
  // A private member makes the type nominal: a spread or literal copy is not assignable
  declare private readonly brand: true;
  readonly categories: readonly Category[];
  readonly venues: readonly Venue[];
  readonly events: readonly Event[];
  readonly occurrences: readonly Occurrence[];

  constructor(data: EventsDataInput) {
    assertIntegrity(data);
    this.categories = freezeAll(data.categories);
    this.venues = freezeAll(data.venues, copyVenue);
    this.events = freezeAll(data.events);
    this.occurrences = freezeAll(data.occurrences, copyOccurrence);
  }
}

/** Unique ids, resolving references and Warsaw ISO start times; throws EventsIntegrityError otherwise. */
export function createEventsData(data: EventsDataInput): EventsData {
  return new EventsData(data);
}
