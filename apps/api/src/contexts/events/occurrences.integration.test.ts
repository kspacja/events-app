import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { occurrenceListingSchema } from '@events/contract/listing';
import { compareListings } from '@events/contract/source';
import { createEventsData, eventId, occurrenceId, toListings, venueId, type Price } from '@events/repo';
import { eventDayOf, isDayInRange, type DateRange } from '@events/time';
import { createApp } from '../../app';
import { createDb } from '../../db';
import { TEST_DATABASE_URL } from '../../test/integrationDatabase';
import { createOccurrenceReader } from './occurrences';
import { eventCategories } from './schema';
import { seedEvents } from './seed';

const VENUE = { id: venueId('hall'), name: 'Hala', address: 'ul. Wystawowa 1', city: 'Wrocław', location: { lat: 51.1, lng: 17 } };
const PAID: Price = { kind: 'paid', from: 40, to: 80, currency: 'PLN' };

const occurrence = (id: string, event: string, startsAt: string, price: Price | null = null) => ({
  id: occurrenceId(id),
  eventId: eventId(event),
  venueId: VENUE.id,
  startsAt,
  price,
});

// Saturday 2030-01-05 and Sunday 2030-01-06, winter time (+01:00)
const DATA = createEventsData({
  categories: [
    { slug: 'music', label: 'Muzyka' },
    { slug: 'art', label: 'Sztuka' },
    { slug: 'food', label: 'Jedzenie' },
  ],
  venues: [VENUE],
  events: [
    { id: eventId('gig'), title: 'Gig', categorySlugs: ['art', 'music'], forSchools: false },
    { id: eventId('market'), title: 'Market', categorySlugs: ['food'], forSchools: false, imageUrl: '/market.jpg' },
    { id: eventId('class'), title: 'Class', categorySlugs: ['art'], forSchools: true },
  ],
  occurrences: [
    occurrence('friday-night', 'gig', '2030-01-05T03:59:00+01:00'),
    occurrence('abc', 'gig', '2030-01-05T23:00:00+01:00', PAID),
    occurrence('Zed', 'market', '2030-01-05T23:00:00+01:00', { kind: 'free' }),
    occurrence('after-midnight', 'gig', '2030-01-06T01:30:00+01:00'),
    occurrence('sunday', 'market', '2030-01-06T04:00:00+01:00'),
    occurrence('school-class', 'class', '2030-01-05T10:00:00+01:00'),
  ],
});

// Spring forward 2030-03-31 02:00 -> 03:00, fall back 2030-10-27 03:00 -> 02:00
const DST_DATA = createEventsData({
  categories: [{ slug: 'music', label: 'Muzyka' }],
  venues: [VENUE],
  events: [{ id: eventId('gig'), title: 'Gig', categorySlugs: ['music'], forSchools: false }],
  occurrences: [
    occurrence('spring-0330', 'gig', '2030-03-31T03:30:00+02:00'),
    occurrence('spring-0400', 'gig', '2030-03-31T04:00:00+02:00'),
    occurrence('autumn-0130-summer', 'gig', '2030-10-27T01:30:00+02:00'),
    occurrence('autumn-0130-winter', 'gig', '2030-10-27T02:30:00+01:00'),
    occurrence('autumn-0400', 'gig', '2030-10-27T04:00:00+01:00'),
  ],
});

const db = createDb(TEST_DATABASE_URL);
const listOccurrences = createOccurrenceReader(db);
const general = (range: DateRange) => listOccurrences({ ...range, forSchools: false });
const ids = (listings: readonly { occurrenceId: string }[]) => listings.map(({ occurrenceId: id }) => id);

beforeEach(async () => {
  await seedEvents(db, DATA);
});

afterAll(async () => {
  await db.$client.end();
});

describe('createOccurrenceReader on Postgres', () => {
  it('counts the 04:00 boundary towards the event day, as the portal does', async () => {
    expect(ids(await general({ from: '2030-01-05', to: '2030-01-05' }))).toEqual([
      'Zed',
      'abc',
      'after-midnight',
    ]);
    expect(ids(await general({ from: '2030-01-06', to: '2030-01-06' }))).toEqual(['sunday']);
    expect(ids(await general({ from: '2030-01-04', to: '2030-01-04' }))).toEqual(['friday-night']);
  });

  it('orders the same start by id the way compareListings does', async () => {
    const listings = await general({ from: '2030-01-04', to: '2030-01-06' });

    expect(ids(listings)).toEqual(ids([...listings].sort(compareListings)));
  });

  it('lists categories by position, the main one first, even with gaps', async () => {
    await db.update(eventCategories).set({ position: 7 }).where(eq(eventCategories.categorySlug, 'music'));
    await db.update(eventCategories).set({ position: 3 }).where(eq(eventCategories.categorySlug, 'art'));

    const [gig] = await general({ from: '2030-01-04', to: '2030-01-04' });

    expect(gig.event.categories.map(({ slug }) => slug)).toEqual(['art', 'music']);
  });

  async function saturdayListing(id: string) {
    const listings = await general({ from: '2030-01-05', to: '2030-01-05' });
    const found = listings.find((listing) => listing.occurrenceId === id);
    if (!found) throw new Error(`${id} missing from Saturday`);
    return found;
  }

  it('round-trips the three price states', async () => {
    expect((await saturdayListing('abc')).price).toEqual(PAID);
    expect((await saturdayListing('Zed')).price).toEqual({ kind: 'free' });
    expect((await saturdayListing('after-midnight')).price).toBeNull();
  });

  it('keeps an image and leaves a missing one out', async () => {
    expect((await saturdayListing('Zed')).event.imageUrl).toBe('/market.jpg');
    expect((await saturdayListing('abc')).event).not.toHaveProperty('imageUrl');
  });

  it('returns the start as Warsaw time with its offset', async () => {
    expect((await saturdayListing('after-midnight')).startsAt).toBe('2030-01-06T01:30:00+01:00');
  });

  it('serves the same occurrences as the portal mock for the same data', async () => {
    // The MSW handler joins with toListings and filters by eventDayOf, see apps/portal/src/mocks/handlers.ts
    const ranges: DateRange[] = [
      { from: '2030-01-04', to: '2030-01-04' },
      { from: '2030-01-05', to: '2030-01-05' },
      { from: '2030-01-06', to: '2030-01-06' },
      { from: '2030-01-01', to: '2030-01-31' },
    ];
    for (const range of ranges) {
      for (const forSchools of [false, true]) {
        const mocked = toListings(DATA).filter(
          ({ startsAt, event }) => event.forSchools === forSchools && isDayInRange(eventDayOf(startsAt), range),
        );

        expect(await listOccurrences({ ...range, forSchools })).toEqual([...mocked].sort(compareListings));
      }
    }
  });

  it('keeps the 04:00 boundary across both DST changes', async () => {
    await seedEvents(db, DST_DATA);

    expect(ids(await general({ from: '2030-03-30', to: '2030-03-30' }))).toEqual(['spring-0330']);
    expect(ids(await general({ from: '2030-03-31', to: '2030-03-31' }))).toEqual(['spring-0400']);
    expect(ids(await general({ from: '2030-10-26', to: '2030-10-26' }))).toEqual([
      'autumn-0130-summer',
      'autumn-0130-winter',
    ]);
    expect(ids(await general({ from: '2030-10-27', to: '2030-10-27' }))).toEqual(['autumn-0400']);
  });

  it('keeps events for schools out of the general programme and lists them only for schools', async () => {
    const saturday: DateRange = { from: '2030-01-05', to: '2030-01-05' };

    expect(ids(await general(saturday))).not.toContain('school-class');
    expect(ids(await listOccurrences({ ...saturday, forSchools: true }))).toEqual(['school-class']);
  });

  it('skips an occurrence that breaks the contract and serves the rest', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await db.delete(eventCategories).where(eq(eventCategories.eventId, 'market'));

    expect(ids(await general({ from: '2030-01-05', to: '2030-01-05' }))).toEqual(['abc', 'after-midnight']);
  });

  it('serves the contract shape over HTTP', async () => {
    const response = await createApp({ listOccurrences }).request('/occurrences?from=2030-01-04&to=2030-01-06');

    const body = (await response.json()) as { occurrences: unknown[] };

    expect(response.status).toBe(200);
    expect(body.occurrences.map((listing) => occurrenceListingSchema.parse(listing))).toHaveLength(5);
  });
});
