import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/listing';
import { toListings } from './listings';
import { EventsData, EventsIntegrityError, createEventsData, venueId, type EventsDataInput } from './model';

const MUSIC = { slug: 'music', label: 'Muzyka' };
const VENUE = { id: venueId('hall'), name: 'Hala', address: 'ul. Wystawowa 1', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const EVENT = { id: eventIdSchema.parse('jazz'), title: 'Jazz', categorySlugs: ['music'] };
const OCCURRENCE = {
  id: occurrenceIdSchema.parse('jazz-2030-01-01'),
  eventId: EVENT.id,
  venueId: VENUE.id,
  startsAt: '2030-01-01T19:00:00+01:00',
  price: null,
};
const VALID: EventsDataInput = {
  categories: [MUSIC],
  venues: [VENUE],
  events: [EVENT],
  occurrences: [OCCURRENCE],
};

describe('venueId', () => {
  it('rejects characters that are unsafe in DOM ids and URLs', () => {
    expect(() => venueId('bad id')).toThrow();
    expect(venueId('ok_id-1')).toBe('ok_id-1');
  });
});

describe('createEventsData', () => {
  it('holds the given data', () => {
    expect(createEventsData(VALID)).toMatchObject(VALID);
  });

  it.each([
    ['occurrence', { ...VALID, occurrences: [OCCURRENCE, OCCURRENCE] }],
    ['event', { ...VALID, events: [EVENT, EVENT] }],
    ['venue', { ...VALID, venues: [VENUE, VENUE] }],
    ['category', { ...VALID, categories: [MUSIC, MUSIC] }],
  ])('rejects a duplicate %s id', (kind, data) => {
    expect(() => createEventsData(data)).toThrow(`Duplicate ${kind} id`);
  });

  it.each([
    ['an unknown category', ['music', 'opera']],
    ['no category', []],
    ['a repeated category', ['music', 'music']],
  ])('rejects an event with %s', (_name, categorySlugs) => {
    const data = { ...VALID, events: [{ ...EVENT, categorySlugs }] };
    expect(() => createEventsData(data)).toThrow(EventsIntegrityError);
  });

  it('rejects an occurrence with an unknown event or venue', () => {
    const unknownEvent = { ...VALID, occurrences: [{ ...OCCURRENCE, eventId: eventIdSchema.parse('x') }] };
    const unknownVenue = { ...VALID, occurrences: [{ ...OCCURRENCE, venueId: venueId('x') }] };
    expect(() => createEventsData(unknownEvent)).toThrow(EventsIntegrityError);
    expect(() => createEventsData(unknownVenue)).toThrow(EventsIntegrityError);
  });

  it('rejects an occurrence whose startsAt is not canonical Warsaw ISO', () => {
    const utc = { ...VALID, occurrences: [{ ...OCCURRENCE, startsAt: '2030-01-01T18:00:00Z' }] };
    expect(() => createEventsData(utc)).toThrow(EventsIntegrityError);
  });

  it('is unaffected by later mutation of the input arrays', () => {
    const input = { categories: [MUSIC], venues: [VENUE], events: [EVENT], occurrences: [OCCURRENCE] };
    const data = createEventsData(input);
    const before = toListings(data);
    input.occurrences.length = 0;
    input.events.length = 0;
    expect(toListings(data)).toEqual(before);
    expect(before).toHaveLength(1);
    expect(Object.isFrozen(data.occurrences)).toBe(true);
  });

  it('is unaffected by later mutation of nested input values', () => {
    const input = {
      categories: [MUSIC],
      venues: [{ ...VENUE, location: { ...VENUE.location } }],
      events: [EVENT],
      occurrences: [{ ...OCCURRENCE, price: { kind: 'paid' as const, from: 10, to: null, currency: 'PLN' as const } }],
    };
    const data = createEventsData(input);
    const before = toListings(data);

    input.venues[0].location.lat = 0;
    input.occurrences[0].price.from = 999;

    expect(toListings(data)).toEqual(before);
    expect(Object.isFrozen(data.venues[0].location)).toBe(true);
    expect(Object.isFrozen(data.occurrences[0].price)).toBe(true);
  });

  it('is opaque: a plain object or spread copy is not an EventsData', () => {
    const data = createEventsData(VALID);
    // @ts-expect-error a literal lacks the private brand
    const fromLiteral: EventsData = { ...VALID };
    // @ts-expect-error a spread copy loses the brand
    const fromSpread: EventsData = { ...data };
    expect(fromLiteral).not.toBeInstanceOf(EventsData);
    expect(fromSpread).not.toBeInstanceOf(EventsData);
  });
});
