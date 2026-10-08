import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OccurrenceSourceError } from '@events/contract/source';
import { addDays, localDayOf, mondayOf, type DateRange } from '@events/time';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { createHttpOccurrenceSource } from './httpOccurrenceSource';

const OCCURRENCES_URL = `${TEST_EVENTS_API_URL}/occurrences`;

const firstMonday = mondayOf(localDayOf(new Date('2026-10-07T12:00:00+02:00')));

function countRequests() {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/occurrences')) urls.push(url);
  });
  return urls;
}

const httpSource = createHttpOccurrenceSource(TEST_EVENTS_API_URL);
const listOccurrences = (range: DateRange) =>
  httpSource.listOccurrences(range);

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
