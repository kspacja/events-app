import { addDays, type DateRange } from '@events/time';
import type { OccurrenceListing } from '@events/contract/listing';
import { MAX_DAYS_PER_REQUEST, occurrencesResponseSchema } from '@events/contract/occurrences-http';
import { compareListings, OccurrenceSourceError, type OccurrenceSource } from '@events/contract/source';

export interface HttpOccurrenceSourceOptions {
  readonly forSchools?: boolean;
}

/** What differs between the server and the browser: how a request is sent and where errors are logged. */
export interface HttpTransport {
  /** `bypassCache` asks for a fresh body, used once when a cached one no longer matches the contract. */
  request(url: string, bypassCache: boolean): Promise<Response>;
  logError(message: string, context: Record<string, unknown>): void;
}

function splitIntoChunks(range: DateRange): DateRange[] {
  const chunks: DateRange[] = [];
  for (let from = range.from; from <= range.to; from = addDays(from, MAX_DAYS_PER_REQUEST)) {
    const lastDay = addDays(from, MAX_DAYS_PER_REQUEST - 1);
    chunks.push({ from, to: lastDay < range.to ? lastDay : range.to });
  }
  return chunks;
}

function dedupeByOccurrenceId(listings: readonly OccurrenceListing[]): OccurrenceListing[] {
  return [...new Map(listings.map((listing) => [listing.occurrenceId, listing])).values()];
}

async function readChunk(transport: HttpTransport, url: string, bypassCache: boolean) {
  const response = await transport.request(url, bypassCache);
  if (!response.ok) {
    transport.logError('Occurrences API responded with an error status', { status: response.status, url });
    throw new OccurrenceSourceError({ cause: { status: response.status } });
  }
  const body: unknown = await response.json().catch(() => undefined);
  return occurrencesResponseSchema.safeParse(body);
}

async function fetchChunk(
  transport: HttpTransport,
  eventsApiUrl: string,
  range: DateRange,
  forSchools: boolean,
): Promise<OccurrenceListing[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  // Only set when needed, so general-programme URLs (and their cache entries) stay as they were
  if (forSchools) params.set('forSchools', 'true');
  const url = `${eventsApiUrl}/occurrences?${params}`;

  try {
    let parsed = await readChunk(transport, url, false);
    if (!parsed.success) {
      // A cached body may predate a contract change; bypass the cache once before giving up.
      // The no-store retry does not refresh the cached entry, so until revalidation each request costs two fetches.
      parsed = await readChunk(transport, url, true);
    }
    if (!parsed.success) {
      transport.logError('Occurrences API returned an unexpected payload shape', { url, issues: parsed.error.issues });
      throw new OccurrenceSourceError({ cause: parsed.error });
    }
    return parsed.data.occurrences;
  } catch (error: unknown) {
    if (error instanceof OccurrenceSourceError) throw error;
    transport.logError('Occurrences API request failed', { url, error });
    throw new OccurrenceSourceError({ cause: error });
  }
}

export function createOccurrenceSourceOver(
  transport: HttpTransport,
  eventsApiUrl: string,
  { forSchools = false }: HttpOccurrenceSourceOptions = {},
): OccurrenceSource {
  return {
    async listOccurrences(range) {
      const chunks = await Promise.all(
        splitIntoChunks(range).map((chunk) => fetchChunk(transport, eventsApiUrl, chunk, forSchools)),
      );
      return dedupeByOccurrenceId(chunks.flat()).sort(compareListings);
    },
  };
}
