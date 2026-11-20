import { describe, expect, it } from 'vitest';
import { occurrenceListingSchema, type OccurrenceListing } from '@events/contract/listing';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { occurrencesHandler } from './handlers';
import { matchesKeywords, searchHandlers } from './schoolSearch';

const MUSEUM = { slug: 'muzeum-sztuki-dawnej', name: 'Muzeum Sztuki Dawnej' };
const SCIENCE = { slug: 'fundacja-mlodzi-odkrywcy', name: 'Fundacja Młodzi Odkrywcy' };

function listing(id: string, title: string, venue: { name: string; city: string }, extra: Partial<OccurrenceListing['event']> = {}) {
  return occurrenceListingSchema.parse({
    occurrenceId: `${id}-2030-01-07`,
    startsAt: '2030-01-07T10:00:00+01:00',
    price: null,
    event: { id, title, categories: [{ slug: 'film', label: 'Film' }], forSchools: true, ...extra },
    venue: { ...venue, address: 'ul. Testowa 1', lat: 51, lng: 17 },
  });
}

const FILM = listing('film', 'Kino szkolne', { name: 'Długie Pobrzeże', city: 'Gdańsk' }, { description: 'Historia miasta na ekranie.' });
const LESSON = listing('lesson', 'Lekcja muzealna', { name: 'Muzeum Narodowe', city: 'Wrocław' });

describe('matchesKeywords', () => {
  it('needs every word, in any field, without Polish marks', () => {
    expect(matchesKeywords(FILM, 'film gdansk')).toBe(true);
    expect(matchesKeywords(FILM, 'historia EKRANIE')).toBe(true);
    expect(matchesKeywords(FILM, 'film wroclaw')).toBe(false);
  });
});

describe('occurrencesHandler search params', () => {
  const RANGE = '?from=2030-01-07&to=2030-01-07&forSchools=true';

  async function ids(query: string) {
    const body = (await (await fetch(`${TEST_EVENTS_API_URL}/occurrences${RANGE}${query}`)).json()) as { occurrences: OccurrenceListing[] };
    return body.occurrences.map(({ event }) => event.id);
  }

  it('narrows by keywords, venue and organizer, and adds the organizer to the listing', async () => {
    server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => [FILM, LESSON], {}, undefined, { film: SCIENCE, lesson: MUSEUM }));

    expect(await ids('&q=kino')).toEqual(['film']);
    expect(await ids('&miejsce=muzeum-narodowe-wroclaw')).toEqual(['lesson']);
    expect(await ids(`&organizator=${SCIENCE.slug}`)).toEqual(['film']);
    expect(await ids('&q=odkrywcy')).toEqual(['film']);
  });
});

describe('search suggestions', () => {
  it('hints organizers and school venues by the start of a word', async () => {
    server.use(...searchHandlers(TEST_EVENTS_API_URL, [MUSEUM, SCIENCE], () => [FILM, LESSON]));

    const body: unknown = await (await fetch(`${TEST_EVENTS_API_URL}/search/suggestions?q=muz`)).json();
    expect(body).toEqual({
      organizers: [MUSEUM],
      venues: [{ id: 'muzeum-narodowe-wroclaw', name: 'Muzeum Narodowe', city: 'Wrocław' }],
    });
  });

  it('rejects a query shorter than 2 letters', async () => {
    expect((await fetch(`${TEST_EVENTS_API_URL}/search/suggestions?q=m`)).status).toBe(400);
  });

  it('finds an organizer by slug, or answers 404', async () => {
    server.use(...searchHandlers(TEST_EVENTS_API_URL, [MUSEUM], () => []));

    expect(await (await fetch(`${TEST_EVENTS_API_URL}/organizers/${MUSEUM.slug}`)).json()).toEqual({ organizer: MUSEUM });
    expect((await fetch(`${TEST_EVENTS_API_URL}/organizers/nikt`)).status).toBe(404);
  });

  it('adds the organizer profile when MSW knows one', async () => {
    const profile = { kind: 'Muzeum', description: '', address: 'ul. Testowa 1', postalCode: '00-001', city: 'Wrocław', lat: 51, lng: 17 };
    server.use(...searchHandlers(TEST_EVENTS_API_URL, [MUSEUM], () => [], { [MUSEUM.slug]: profile }));

    expect(await (await fetch(`${TEST_EVENTS_API_URL}/organizers/${MUSEUM.slug}`)).json()).toEqual({ organizer: MUSEUM, profile });
  });
});
