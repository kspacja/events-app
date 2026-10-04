import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeOccurrenceSourceConformance } from '@events/contract/source/testing';
import { OccurrenceSourceError } from '@events/contract/source';
import { catalogFromListings } from '@events/catalog/testing';
import { listOccurrences as projectCatalog } from '@events/catalog';
import { addDays, localDayOf, mondayOf, type DateRange } from '@events/time';
import { EVENTS_API_URL } from '@/config/env';
import { occurrencesHandler } from '@/mocks/handlers';
import { server } from '@/mocks/node';
import { createHttpOccurrenceSource } from './httpOccurrenceSource';

const OCCURRENCES_URL = `${EVENTS_API_URL}/occurrences`;

const firstMonday = mondayOf(localDayOf(new Date()));

function countRequests() {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/occurrences')) urls.push(url);
  });
  return urls;
}

const httpSource = createHttpOccurrenceSource();
const listOccurrences = (range: DateRange) =>
  httpSource.listOccurrences(range);

describeOccurrenceSourceConformance('HTTP occurrence source', () => ({
  source: createHttpOccurrenceSource(),
  seed: (listings) => {
    const catalog = catalogFromListings(listings);
    server.use(occurrencesHandler((range) => projectCatalog(catalog, range)));
  },
  breakBackend: () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(OCCURRENCES_URL, () => new HttpResponse(null, { status: 503 })));
  },
}));

describe('HTTP occurrence source', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('uses a single request for a 31-day range', async () => {
    const urls = countRequests();
    await listOccurrences({ from: firstMonday, to: addDays(firstMonday, 30) });

    expect(urls).toHaveLength(1);
  });

  it('splits a 32-day range into two requests', async () => {
    const urls = countRequests();
    await listOccurrences({ from: firstMonday, to: addDays(firstMonday, 31) });

    expect(urls).toHaveLength(2);
  });

  it('de-duplicates occurrences returned by more than one chunk', async () => {
    const listing = {
      occurrenceId: 'dup-2030-01-01',
      startsAt: '2030-01-01T18:00:00+01:00',
      price: null,
      event: { id: 'dup', title: 'Duplicate', category: { slug: 'music', label: 'Muzyka' } },
      venue: { name: 'Hall', city: 'Warszawa', lat: 52, lng: 21 },
    };
    server.use(
      http.get(OCCURRENCES_URL, () => HttpResponse.json({ occurrences: [listing] })),
    );

    const occurrences = await listOccurrences({
      from: firstMonday,
      to: addDays(firstMonday, 40),
    });

    expect(occurrences).toHaveLength(1);
  });

  it('wraps a 500 response in OccurrenceSourceError with the status as cause', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(OCCURRENCES_URL, () => new HttpResponse(null, { status: 500 })));

    const failure = listOccurrences({ from: firstMonday, to: firstMonday });

    await expect(failure).rejects.toBeInstanceOf(OccurrenceSourceError);
    await expect(failure).rejects.toMatchObject({ cause: { status: 500 } });
  });

  it('wraps a malformed body in OccurrenceSourceError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(OCCURRENCES_URL, () => HttpResponse.json({ occurrences: [{ occurrenceId: 1 }] })),
    );

    await expect(
      listOccurrences({ from: firstMonday, to: firstMonday }),
    ).rejects.toBeInstanceOf(OccurrenceSourceError);
  });

  it('returns listings sorted even when the backend answers in shuffled order', async () => {
    const at = (id: string, startsAt: string) => ({
      occurrenceId: id,
      startsAt,
      price: null,
      event: { id: `event-${id}`, title: id, category: { slug: 'music', label: 'Muzyka' } },
      venue: { name: 'Hall', city: 'Warszawa', lat: 52, lng: 21 },
    });
    const shuffled = [
      at('c', '2030-01-01T20:00:00+01:00'),
      at('b', '2030-01-01T18:00:00+01:00'),
      at('a', '2030-01-01T18:00:00+01:00'),
    ];
    server.use(
      http.get(OCCURRENCES_URL, () => HttpResponse.json({ occurrences: shuffled })),
    );

    const result = await listOccurrences({ from: firstMonday, to: firstMonday });

    expect(result.map(({ occurrenceId }) => occurrenceId)).toEqual(['a', 'b', 'c']);
  });

  it('retries once when the first body is malformed and succeeds on the valid second one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const urls = countRequests();
    let calls = 0;
    server.use(
      http.get(OCCURRENCES_URL, () => {
        calls += 1;
        return HttpResponse.json({ occurrences: calls === 1 ? [{ occurrenceId: 1 }] : [] });
      }),
    );

    const result = await listOccurrences({ from: firstMonday, to: firstMonday });

    expect(result).toEqual([]);
    expect(urls).toHaveLength(2);
  });

  it('retries once when the first body is not valid JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const urls = countRequests();
    let calls = 0;
    server.use(
      http.get(OCCURRENCES_URL, () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse('<html>', { headers: { 'Content-Type': 'application/json' } })
          : HttpResponse.json({ occurrences: [] });
      }),
    );

    const result = await listOccurrences({ from: firstMonday, to: firstMonday });

    expect(result).toEqual([]);
    expect(urls).toHaveLength(2);
  });

  it('gives up after one retry when the body stays malformed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const urls = countRequests();
    server.use(
      http.get(OCCURRENCES_URL, () => HttpResponse.json({ occurrences: [{ occurrenceId: 1 }] })),
    );

    await expect(
      listOccurrences({ from: firstMonday, to: firstMonday }),
    ).rejects.toBeInstanceOf(OccurrenceSourceError);

    expect(urls).toHaveLength(2);
  });

  it('wraps a network failure in OccurrenceSourceError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(OCCURRENCES_URL, () => HttpResponse.error()));

    await expect(
      listOccurrences({ from: firstMonday, to: firstMonday }),
    ).rejects.toBeInstanceOf(OccurrenceSourceError);
  });
});

describe('mock occurrences handler contract', () => {
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
});
