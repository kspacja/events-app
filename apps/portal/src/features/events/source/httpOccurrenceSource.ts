import 'server-only';

import type { OccurrenceSource } from '@events/contract/source';
import { logger } from '@/lib/logger';
import { createOccurrenceSourceOver, type HttpOccurrenceSourceOptions, type HttpTransport } from './httpOccurrenceSourceCore';

const REQUEST_TIMEOUT_MS = 5000;
const REVALIDATE_SECONDS = 300;

const serverTransport: HttpTransport = {
  request: (url, bypassCache) =>
    fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(bypassCache ? { cache: 'no-store' } : { next: { revalidate: REVALIDATE_SECONDS } }),
    }),
  logError: (message, context) => logger.error(message, context),
};

export type { HttpOccurrenceSourceOptions };

export function createHttpOccurrenceSource(eventsApiUrl: string, options?: HttpOccurrenceSourceOptions): OccurrenceSource {
  return createOccurrenceSourceOver(serverTransport, eventsApiUrl, options);
}
