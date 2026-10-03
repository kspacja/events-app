import 'server-only';

import { EVENTS_API_URL } from '@/config/env';
import type { DateRange } from '@/features/search/dateRange';
import { addDays } from '@/features/time/localTime';
import { logger } from '@/lib/logger';
import { eventsResponseSchema, MAX_DAYS_PER_REQUEST } from './contract';
import type { Event } from './types';

const REQUEST_TIMEOUT_MS = 5000;
const REVALIDATE_SECONDS = 300;

export class EventsApiError extends Error {
  constructor() {
    super('Events are temporarily unavailable.');
    this.name = 'EventsApiError';
  }
}

function splitIntoChunks(range: DateRange): DateRange[] {
  const chunks: DateRange[] = [];
  for (
    let from = range.from;
    from <= range.to;
    from = addDays(from, MAX_DAYS_PER_REQUEST)
  ) {
    const lastDay = addDays(from, MAX_DAYS_PER_REQUEST - 1);
    chunks.push({ from, to: lastDay < range.to ? lastDay : range.to });
  }
  return chunks;
}

function dedupeById(events: readonly Event[]): Event[] {
  return [...new Map(events.map((event) => [event.id, event])).values()];
}

async function fetchChunk(range: DateRange): Promise<Event[]> {
  const url = `${EVENTS_API_URL}/events?${new URLSearchParams({
    from: range.from,
    to: range.to,
  })}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      logger.error('Events API responded with an error status', {
        status: response.status,
        url,
      });
      throw new EventsApiError();
    }
    const parsed = eventsResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.error('Events API returned an unexpected payload shape', {
        url,
        issues: parsed.error.issues,
      });
      throw new EventsApiError();
    }
    return parsed.data.events;
  } catch (error: unknown) {
    if (error instanceof EventsApiError) throw error;
    logger.error('Events API request failed', { url, error });
    throw new EventsApiError();
  }
}

/** Accepts any range; returns events de-duplicated by id. */
export async function getEvents(range: DateRange): Promise<Event[]> {
  const chunks = await Promise.all(splitIntoChunks(range).map(fetchChunk));
  return dedupeById(chunks.flat());
}
