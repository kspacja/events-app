import type { OccurrenceSource } from '@events/contract/source';
import { createOccurrenceSourceOver, type HttpOccurrenceSourceOptions, type HttpTransport } from './httpOccurrenceSourceCore';

const REQUEST_TIMEOUT_MS = 5000;

export interface BrowserOccurrenceSourceOptions extends HttpOccurrenceSourceOptions {
  /** Resolves once the MSW worker is running, so no request slips past the mock to the real URL. */
  readonly ready?: Promise<void>;
}

/** The browser reads the API directly (CORS); in dev the MSW worker answers at the same URL. */
export function createBrowserOccurrenceSource(
  eventsApiUrl: string,
  { ready = Promise.resolve(), ...options }: BrowserOccurrenceSourceOptions = {},
): OccurrenceSource {
  const transport: HttpTransport = {
    request: async (url, bypassCache) => {
      await ready;
      return fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...(bypassCache ? { cache: 'no-store' } : {}),
      });
    },
    logError: (message, context) => console.error(`[events] ${message}`, context),
  };
  return createOccurrenceSourceOver(transport, eventsApiUrl, options);
}
