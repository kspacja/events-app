import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OccurrenceSourceError } from '@events/contract/source';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { createBrowserOccurrenceSource } from './httpOccurrenceSourceBrowser';

const OCCURRENCES_URL = `${TEST_EVENTS_API_URL}/occurrences`;
const DAY = { from: '2030-01-07', to: '2030-01-07' } as const;

function recordRequests() {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    urls.push(new URL(request.url));
  });
  return urls;
}

describe('createBrowserOccurrenceSource', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('sends nothing until mocking is ready', async () => {
    const urls = recordRequests();
    let markReady = () => {};
    const ready = new Promise<void>((resolve) => {
      markReady = resolve;
    });

    const listing = createBrowserOccurrenceSource(TEST_EVENTS_API_URL, { ready }).listOccurrences(DAY);
    // Long enough for MSW to report a request that had already been sent
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(urls).toHaveLength(0);

    markReady();
    await listing;
    expect(urls).toHaveLength(1);
  });

  it('asks for events for schools when told to', async () => {
    const urls = recordRequests();

    await createBrowserOccurrenceSource(TEST_EVENTS_API_URL, { forSchools: true }).listOccurrences(DAY);

    expect(urls.map((url) => url.searchParams.get('forSchools'))).toEqual(['true']);
  });

  it('wraps a failing response in OccurrenceSourceError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(http.get(OCCURRENCES_URL, () => new HttpResponse(null, { status: 503 })));

    await expect(createBrowserOccurrenceSource(TEST_EVENTS_API_URL).listOccurrences(DAY)).rejects.toBeInstanceOf(
      OccurrenceSourceError,
    );
  });
});
