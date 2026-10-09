import { describe, expect, it } from 'vitest';
import { occurrenceListingSchema } from '@events/contract/listing';
import { addDays, localDayOf, mondayOf } from '@events/time';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { occurrencesHandler } from './handlers';

const OCCURRENCES_URL = `${TEST_EVENTS_API_URL}/occurrences`;

const firstMonday = mondayOf(localDayOf(new Date('2026-10-07T12:00:00+02:00')));

// Sunday 01:30 belongs to Saturday's event day
const LATE_NIGHT = occurrenceListingSchema.parse({
  occurrenceId: 'late-2030-01-06',
  startsAt: '2030-01-06T01:30:00+01:00',
  price: null,
  event: { id: 'late', title: 'Late', categories: [{ slug: 'comedy', label: 'Komedia' }] },
  venue: { name: 'Club', address: 'ul. Testowa 1', city: 'Kraków', lat: 50, lng: 19 },
});

describe('occurrencesHandler', () => {
  async function call(query: string) {
    const response = await fetch(`${OCCURRENCES_URL}${query}`);
    return { status: response.status, body: (await response.json()) as unknown };
  }

  it('rejects a 32-day range', async () => {
    const result = await call(
      `?from=${firstMonday}&to=${addDays(firstMonday, 31)}`,
    );
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: 'The range must not exceed 31 days.' });
  });

  it('accepts a 31-day range', async () => {
    const result = await call(
      `?from=${firstMonday}&to=${addDays(firstMonday, 30)}`,
    );
    expect(result.status).toBe(200);
  });

  it.each([
    ['', 'Query parameters "from" and "to" are required.'],
    ['?from=2030-02-30&to=2030-03-01', 'Parameters "from" and "to" must be YYYY-MM-DD dates.'],
    ['?from=2030-03-02&to=2030-03-01', '"from" must not be after "to".'],
  ])('rejects %s with a clear error', async (query, error) => {
    const result = await call(query);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });

  it('serves an occurrence after midnight on the previous event day', async () => {
    server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => [LATE_NIGHT]));

    expect((await call('?from=2030-01-05&to=2030-01-05')).body).toEqual({ occurrences: [LATE_NIGHT] });
    expect((await call('?from=2030-01-06&to=2030-01-06')).body).toEqual({ occurrences: [] });
  });
});
