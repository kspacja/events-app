import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { occurrenceListingSchema } from '@events/contract/listing';
import { compareListings } from '@events/contract/source';
import { createEventsData, eventId, occurrenceId, venueId, type Price } from '@events/repo';
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
    { id: eventId('gig'), title: 'Gig', categorySlugs: ['art', 'music'] },
    { id: eventId('market'), title: 'Market', categorySlugs: ['food'], imageUrl: '/market.jpg' },
  ],
  occurrences: [
    occurrence('friday-night', 'gig', '2030-01-05T03:59:00+01:00'),
    occurrence('abc', 'gig', '2030-01-05T23:00:00+01:00', PAID),
    occurrence('Zed', 'market', '2030-01-05T23:00:00+01:00', { kind: 'free' }),
    occurrence('after-midnight', 'gig', '2030-01-06T01:30:00+01:00'),
    occurrence('sunday', 'market', '2030-01-06T04:00:00+01:00'),
  ],
});

const db = createDb(TEST_DATABASE_URL);
const listOccurrences = createOccurrenceReader(db);
const ids = (listings: readonly { occurrenceId: string }[]) => listings.map(({ occurrenceId: id }) => id);

beforeEach(async () => {
  await seedEvents(db, DATA);
});

afterAll(async () => {
  await db.$client.end();
});

describe('createOccurrenceReader on Postgres', () => {
  it('counts the 04:00 boundary towards the event day, as the portal does', async () => {
    expect(ids(await listOccurrences({ from: '2030-01-05', to: '2030-01-05' }))).toEqual([
      'Zed',
      'abc',
      'after-midnight',
    ]);
    expect(ids(await listOccurrences({ from: '2030-01-06', to: '2030-01-06' }))).toEqual(['sunday']);
    expect(ids(await listOccurrences({ from: '2030-01-04', to: '2030-01-04' }))).toEqual(['friday-night']);
  });

  it('orders the same start by id the way compareListings does', async () => {
    const listings = await listOccurrences({ from: '2030-01-04', to: '2030-01-06' });

    expect(ids(listings)).toEqual(ids([...listings].sort(compareListings)));
  });

  it('lists categories by position, the main one first, even with gaps', async () => {
    await db.update(eventCategories).set({ position: 7 }).where(eq(eventCategories.categorySlug, 'music'));
    await db.update(eventCategories).set({ position: 3 }).where(eq(eventCategories.categorySlug, 'art'));

    const [gig] = await listOccurrences({ from: '2030-01-04', to: '2030-01-04' });

    expect(gig.event.categories.map(({ slug }) => slug)).toEqual(['art', 'music']);
  });

  it('round-trips prices, images and Warsaw start times', async () => {
    const listings = await listOccurrences({ from: '2030-01-05', to: '2030-01-05' });
    const byId = new Map(listings.map((listing) => [listing.occurrenceId as string, listing]));

    expect(byId.get('abc')?.price).toEqual(PAID);
    expect(byId.get('Zed')?.price).toEqual({ kind: 'free' });
    expect(byId.get('after-midnight')?.price).toBeNull();
    expect(byId.get('Zed')?.event.imageUrl).toBe('/market.jpg');
    expect(byId.get('abc')?.event).not.toHaveProperty('imageUrl');
    expect(byId.get('after-midnight')?.startsAt).toBe('2030-01-06T01:30:00+01:00');
  });

  it('serves the contract shape over HTTP', async () => {
    const response = await createApp({ listOccurrences }).request('/occurrences?from=2030-01-04&to=2030-01-06');

    const body = (await response.json()) as { occurrences: unknown[] };

    expect(response.status).toBe(200);
    expect(body.occurrences.map((listing) => occurrenceListingSchema.parse(listing))).toHaveLength(5);
  });
});
