import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/listing';
import { listOccurrences } from './listOccurrences';
import { Catalog, CatalogIntegrityError, createCatalog, venueId, type CatalogData } from './model';

const MUSIC = { slug: 'music', label: 'Muzyka' };
const VENUE = { id: venueId('hall'), name: 'Hala', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const EVENT = { id: eventIdSchema.parse('jazz'), title: 'Jazz', categorySlug: 'music' };
const OCCURRENCE = {
  id: occurrenceIdSchema.parse('jazz-2030-01-01'),
  eventId: EVENT.id,
  venueId: VENUE.id,
  startsAt: '2030-01-01T19:00:00+01:00',
  price: null,
};
const VALID: CatalogData = {
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

describe('createCatalog', () => {
  it('returns a catalog holding the given data', () => {
    expect(createCatalog(VALID)).toMatchObject(VALID);
  });

  it.each([
    ['occurrence', { ...VALID, occurrences: [OCCURRENCE, OCCURRENCE] }],
    ['event', { ...VALID, events: [EVENT, EVENT] }],
    ['venue', { ...VALID, venues: [VENUE, VENUE] }],
    ['category', { ...VALID, categories: [MUSIC, MUSIC] }],
  ])('rejects a duplicate %s id', (kind, catalog) => {
    expect(() => createCatalog(catalog)).toThrow(`Duplicate ${kind} id`);
  });

  it('rejects an event with an unknown category', () => {
    const catalog = { ...VALID, events: [{ ...EVENT, categorySlug: 'opera' }] };
    expect(() => createCatalog(catalog)).toThrow(CatalogIntegrityError);
  });

  it('rejects an occurrence with an unknown event or venue', () => {
    const unknownEvent = { ...VALID, occurrences: [{ ...OCCURRENCE, eventId: eventIdSchema.parse('x') }] };
    const unknownVenue = { ...VALID, occurrences: [{ ...OCCURRENCE, venueId: venueId('x') }] };
    expect(() => createCatalog(unknownEvent)).toThrow(CatalogIntegrityError);
    expect(() => createCatalog(unknownVenue)).toThrow(CatalogIntegrityError);
  });

  it('rejects an occurrence whose startsAt is not canonical Warsaw ISO', () => {
    const utc = { ...VALID, occurrences: [{ ...OCCURRENCE, startsAt: '2030-01-01T18:00:00Z' }] };
    expect(() => createCatalog(utc)).toThrow(CatalogIntegrityError);
  });

  it('is unaffected by later mutation of the input arrays', () => {
    const input = { categories: [MUSIC], venues: [VENUE], events: [EVENT], occurrences: [OCCURRENCE] };
    const catalog = createCatalog(input);
    const range = { from: '2030-01-01', to: '2030-01-31' } as const;
    const before = listOccurrences(catalog, range);
    input.occurrences.length = 0;
    input.events.length = 0;
    expect(listOccurrences(catalog, range)).toEqual(before);
    expect(before).toHaveLength(1);
    expect(Object.isFrozen(catalog.occurrences)).toBe(true);
  });

  it('is unaffected by later mutation of nested input values', () => {
    const input = {
      categories: [MUSIC],
      venues: [{ ...VENUE, location: { ...VENUE.location } }],
      events: [EVENT],
      occurrences: [{ ...OCCURRENCE, price: { kind: 'paid' as const, from: 10, to: null, currency: 'PLN' as const } }],
    };
    const catalog = createCatalog(input);
    const range = { from: '2030-01-01', to: '2030-01-31' } as const;
    const before = listOccurrences(catalog, range);

    input.venues[0].location.lat = 0;
    input.occurrences[0].price.from = 999;

    expect(listOccurrences(catalog, range)).toEqual(before);
    expect(Object.isFrozen(catalog.venues[0].location)).toBe(true);
    expect(Object.isFrozen(catalog.occurrences[0].price)).toBe(true);
  });

  it('is opaque: a plain object or spread copy is not a Catalog', () => {
    const catalog = createCatalog(VALID);
    // @ts-expect-error a literal lacks the private brand
    const fromLiteral: Catalog = { ...VALID };
    // @ts-expect-error a spread copy loses the brand
    const fromSpread: Catalog = { ...catalog };
    expect(fromLiteral).not.toBeInstanceOf(Catalog);
    expect(fromSpread).not.toBeInstanceOf(Catalog);
  });
});
