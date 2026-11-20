import 'server-only';

import { cache } from 'react';
import { eventPageResponseSchema, type EventPage } from '@events/contract/event-page';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { logger } from '@/lib/logger';

const REQUEST_TIMEOUT_MS = 5000;
// 0 in dev, so changed sample data shows up on reload
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 0 : 300;

/** The event page's data; null for an unknown event. A failing API throws, so the page shows its error. */
export const loadEventPage = cache(async (eventId: string): Promise<EventPage | null> => {
  const url = `${getRuntimeConfig().eventsApiUrl}/events/${encodeURIComponent(eventId)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), next: { revalidate: REVALIDATE_SECONDS } });
  if (response.status === 404) return null;
  if (!response.ok) {
    logger.error('Event page API responded with an error status', { status: response.status, url });
    throw new Error(`Event page API responded with ${response.status}`);
  }
  return eventPageResponseSchema.parse(await response.json());
});
