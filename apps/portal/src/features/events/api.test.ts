import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { EVENTS_API_URL } from '@/config/env';
import { addDays, localDayOf, mondayOf } from '@events/contract/time';
import { server } from '@/mocks/node';
import { EventsApiError, getEvents } from './api';

const EVENTS_URL = `${EVENTS_API_URL}/events`;
const SIX_WEEKS_DAYS = 42;
const MOCK_DATA_WEEKS = 5;

const firstMonday = mondayOf(localDayOf(new Date()));

function countRequests() {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/events')) urls.push(url);
  });
  return urls;
}

describe('getEvents', () => {
  it('returns unique events from every populated week of a six-week range', async () => {
    const events = await getEvents({
      from: firstMonday,
      to: addDays(firstMonday, SIX_WEEKS_DAYS - 1),
    });

    const ids = events.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);

    for (let week = 0; week < MOCK_DATA_WEEKS; week += 1) {
      const weekStart = addDays(firstMonday, week * 7);
      const weekEnd = addDays(weekStart, 6);
      const inWeek = events.filter((event) => {
        const day = localDayOf(event.startsAt);
        return day >= weekStart && day <= weekEnd;
      });
      expect(inWeek.length).toBeGreaterThan(0);
    }
  });

  it('uses a single request for a 31-day range', async () => {
    const urls = countRequests();
    await getEvents({ from: firstMonday, to: addDays(firstMonday, 30) });
    server.events.removeAllListeners();

    expect(urls).toHaveLength(1);
  });

  it('splits a 32-day range into two requests', async () => {
    const urls = countRequests();
    await getEvents({ from: firstMonday, to: addDays(firstMonday, 31) });
    server.events.removeAllListeners();

    expect(urls).toHaveLength(2);
  });

  it('de-duplicates events returned by more than one chunk', async () => {
    const event = {
      id: 'dup',
      startsAt: '2030-01-01T18:00:00+01:00',
      title: 'Duplicate',
      venue: { name: 'Hall', city: 'Warszawa', lat: 52, lng: 21 },
      category: 'music',
    };
    server.use(
      http.get(EVENTS_URL, () => HttpResponse.json({ events: [event] })),
    );

    const events = await getEvents({
      from: firstMonday,
      to: addDays(firstMonday, 40),
    });

    expect(events).toHaveLength(1);
  });

  it('wraps a 500 response in EventsApiError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(EVENTS_URL, () => new HttpResponse(null, { status: 500 })));

    await expect(
      getEvents({ from: firstMonday, to: firstMonday }),
    ).rejects.toBeInstanceOf(EventsApiError);
  });

  it('wraps a malformed body in EventsApiError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(EVENTS_URL, () => HttpResponse.json({ events: [{ id: 1 }] })),
    );

    await expect(
      getEvents({ from: firstMonday, to: firstMonday }),
    ).rejects.toBeInstanceOf(EventsApiError);
  });
});

describe('mock events handler contract', () => {
  async function call(query: string) {
    const response = await fetch(`${EVENTS_URL}${query}`);
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
