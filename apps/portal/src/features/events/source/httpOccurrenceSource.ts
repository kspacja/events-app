import 'server-only';

import { addDays, type DateRange } from '@events/time';
import { logger } from '@/lib/logger';
import type { OccurrenceListing } from '@events/contract/listing';
import {
  MAX_DAYS_PER_REQUEST,
  occurrencesResponseSchema,
} from '@events/contract/occurrences-http';
import {
  compareListings,
  OccurrenceSourceError,
  type OccurrenceSource,
} from '@events/contract/source';

const REQUEST_TIMEOUT_MS = 5000;
// 0 in dev: changed sample data (MSW) or a reseeded API shows up on the next reload
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 0 : 300;

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

function requestChunk(url: string, cache: RequestCache | undefined) {
  return fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...(cache ? { cache } : { next: { revalidate: REVALIDATE_SECONDS } }),
  });
}

async function readChunk(url: string, cache?: RequestCache) {
  const response = await requestChunk(url, cache);
  if (!response.ok) {
    logger.error('Occurrences API responded with an error status', {
      status: response.status,
      url,
    });
    throw new OccurrenceSourceError({ cause: { status: response.status } });
  }
  const body: unknown = await response.json().catch(() => undefined);
  return occurrencesResponseSchema.safeParse(body);
}

async function fetchChunk(
  eventsApiUrl: string,
  range: DateRange,
  forSchools: boolean,
  filters: Readonly<Record<string, readonly string[]>>,
): Promise<OccurrenceListing[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  // Only set when needed, so general-programme URLs (and their cache entries) stay as they were
  if (forSchools) params.set('forSchools', 'true');
  for (const [param, values] of Object.entries(filters)) params.set(param, values.join(','));
  const url = `${eventsApiUrl}/occurrences?${params}`;

  try {
    let parsed = await readChunk(url);
    if (!parsed.success) {
      // A cached body may predate a contract change; bypass the cache once before giving up.
      // The no-store retry does not refresh the cached entry, so until revalidation each request costs two fetches.
      parsed = await readChunk(url, 'no-store');
    }
    if (!parsed.success) {
      logger.error('Occurrences API returned an unexpected payload shape', {
        url,
        issues: parsed.error.issues,
      });
      throw new OccurrenceSourceError({ cause: parsed.error });
    }
    return parsed.data.occurrences;
  } catch (error: unknown) {
    if (error instanceof OccurrenceSourceError) throw error;
    logger.error('Occurrences API request failed', { url, error });
    throw new OccurrenceSourceError({ cause: error });
  }
}

export interface HttpOccurrenceSourceOptions {
  readonly forSchools?: boolean;
  /** Prototype: school filters as extra query params; only MSW applies them, the real API ignores them. */
  readonly filters?: Readonly<Record<string, readonly string[]>>;
}

export function createHttpOccurrenceSource(
  eventsApiUrl: string,
  { forSchools = false, filters = {} }: HttpOccurrenceSourceOptions = {},
): OccurrenceSource {
  return {
    async listOccurrences(range) {
      const chunks = await Promise.all(
        splitIntoChunks(range).map((chunk) => fetchChunk(eventsApiUrl, chunk, forSchools, filters)),
      );
      return dedupeByOccurrenceId(chunks.flat()).sort(compareListings);
    },
  };
}
