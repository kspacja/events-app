import 'server-only';

import { EVENTS_API_URL } from '@/config/env';
import type { DateRange } from '@/features/search/dateRange';
import { addDays } from '@events/time';
import { logger } from '@/lib/logger';
import {
  MAX_DAYS_PER_REQUEST,
  occurrencesResponseSchema,
} from '@events/contract/occurrences';
import type { OccurrenceListing } from '../types';
import { OccurrenceSourceError, type OccurrenceSource } from './occurrenceSource';

const REQUEST_TIMEOUT_MS = 5000;
const REVALIDATE_SECONDS = 300;

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

function dedupeByOccurrenceId(
  listings: readonly OccurrenceListing[],
): OccurrenceListing[] {
  return [
    ...new Map(listings.map((listing) => [listing.occurrenceId, listing])).values(),
  ];
}

async function fetchChunk(range: DateRange): Promise<OccurrenceListing[]> {
  const url = `${EVENTS_API_URL}/occurrences?${new URLSearchParams({
    from: range.from,
    to: range.to,
  })}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      logger.error('Occurrences API responded with an error status', {
        status: response.status,
        url,
      });
      throw new OccurrenceSourceError();
    }
    const parsed = occurrencesResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.error('Occurrences API returned an unexpected payload shape', {
        url,
        issues: parsed.error.issues,
      });
      throw new OccurrenceSourceError();
    }
    return parsed.data.occurrences;
  } catch (error: unknown) {
    if (error instanceof OccurrenceSourceError) throw error;
    logger.error('Occurrences API request failed', { url, error });
    throw new OccurrenceSourceError();
  }
}

export function createHttpOccurrenceSource(): OccurrenceSource {
  return {
    async listOccurrences(range) {
      const chunks = await Promise.all(splitIntoChunks(range).map(fetchChunk));
      return dedupeByOccurrenceId(chunks.flat());
    },
  };
}
