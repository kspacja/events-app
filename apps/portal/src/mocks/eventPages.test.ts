import { describe, expect, it } from 'vitest';
import { eventPageResponseSchema } from '@events/contract/event-page';
import { occurrenceListingSchema, type OccurrenceListing } from '@events/contract/listing';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { eventPageHandler, similarTo } from './eventPages';

function listing(id: string, day: string, categories: string[], subjects: string[] = []): OccurrenceListing {
  return occurrenceListingSchema.parse({
    occurrenceId: `${id}-${day}`,
    startsAt: `${day}T10:00:00+01:00`,
    price: null,
    event: {
      id,
      title: id,
      categories: categories.map((slug) => ({ slug, label: slug })),
      forSchools: true,
      school: { ages: [], subjects, groupSizes: [], kinds: [] },
    },
    venue: { name: 'Sala', address: 'ul. Testowa 1', city: 'Wrocław', lat: 51, lng: 17 },
  });
}

const CONCERT = listing('concert', '2030-01-07', ['music'], ['muzyka']);
const CHOIR = listing('choir', '2030-01-08', ['music'], ['muzyka']);
const CHOIR_LATER = listing('choir', '2030-01-15', ['music'], ['muzyka']);
const ORGAN = listing('organ', '2030-01-09', ['music']);
const FARM = listing('farm', '2030-01-08', ['movement'], ['przyroda']);

describe('similarTo', () => {
  it('keeps the next occurrence of each event that shares something, best match first', () => {
    expect(similarTo(CONCERT.event, [CONCERT, CHOIR_LATER, CHOIR, ORGAN, FARM], '2030-01-07').map(({ occurrenceId }) => occurrenceId)).toEqual([
      'choir-2030-01-08',
      'organ-2030-01-09',
    ]);
  });

  it('leaves out occurrences before today', () => {
    expect(similarTo(CONCERT.event, [CHOIR, CHOIR_LATER], '2030-01-10').map(({ occurrenceId }) => occurrenceId)).toEqual(['choir-2030-01-15']);
  });
});

describe('eventPageHandler', () => {
  it('serves every occurrence of the event with its details, or 404', async () => {
    server.use(eventPageHandler(TEST_EVENTS_API_URL, () => [CHOIR_LATER, CONCERT, CHOIR], () => undefined));

    const body = eventPageResponseSchema.parse(await (await fetch(`${TEST_EVENTS_API_URL}/events/choir`)).json());
    expect(body.occurrences.map(({ occurrenceId }) => occurrenceId)).toEqual(['choir-2030-01-08', 'choir-2030-01-15']);
    expect(body.details).toBeUndefined();
    expect((await fetch(`${TEST_EVENTS_API_URL}/events/nothing`)).status).toBe(404);
  });
});
