import { describe, expect, it } from 'vitest';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/listing';
import { CatalogIntegrityError, createCatalog, venueId, type Catalog } from './model';

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
const VALID: Catalog = {
  categories: [MUSIC],
  venues: [VENUE],
  events: [EVENT],
  occurrences: [OCCURRENCE],
};

describe('venueId', () => {
  it('rejects characters that are unsafe in DOM ids and URLs', () => {
    expect(() => venueId('bad id')).toThrow();
  });
});

describe('createCatalog', () => {
  it('returns a consistent catalog unchanged', () => {
    expect(createCatalog(VALID)).toBe(VALID);
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
});
