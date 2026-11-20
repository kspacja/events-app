import 'server-only';

import { cache } from 'react';
import type { OccurrenceListing, Organizer } from '@events/contract/listing';
import { organizerResponseSchema, suggestionsResponseSchema, type Suggestions } from '@events/contract/search';
import { addDays, currentEventDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { LOCALITY_PARAM, RADIUS_PARAM, type Place } from '@/features/locality/place';
import { KEYWORDS_PARAM, ORGANIZER_PARAM, VENUE_PARAM } from './searchHref';

const REQUEST_TIMEOUT_MS = 5000;
// 0 in dev, so changed sample data shows up on reload
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 0 : 300;
/** Results reach this many days ahead, today included. */
export const SEARCH_DAYS = 60;

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${getRuntimeConfig().eventsApiUrl}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Search API responded with ${response.status}`);
  return response.json();
}

export async function suggest(query: string): Promise<Suggestions> {
  return suggestionsResponseSchema.parse(await getJson(`/search/suggestions?${new URLSearchParams({ q: query })}`));
}

/** Null when unknown; a failing API throws, so the page shows its error instead of "not found". */
export const findOrganizer = cache(async (slug: string): Promise<Organizer | null> => {
  const body = await getJson(`/organizers/${encodeURIComponent(slug)}`);
  return body === null ? null : organizerResponseSchema.parse(body).organizer;
});

export type SearchCriteria =
  | { readonly by: 'keywords'; readonly keywords: string; readonly place: Place | null }
  | { readonly by: 'venue'; readonly venue: string }
  | { readonly by: 'organizer'; readonly organizer: string };

function asParams(criteria: SearchCriteria): Record<string, readonly string[]> {
  switch (criteria.by) {
    case 'keywords':
      return {
        [KEYWORDS_PARAM]: [criteria.keywords],
        ...(criteria.place
          ? { [LOCALITY_PARAM]: [criteria.place.localityId], [RADIUS_PARAM]: [String(criteria.place.radiusKm)] }
          : {}),
      };
    case 'venue':
      return { [VENUE_PARAM]: [criteria.venue] };
    case 'organizer':
      return { [ORGANIZER_PARAM]: [criteria.organizer] };
  }
}

/** Upcoming school events that match, soonest first; prototype: only MSW narrows by these params. */
export const loadSearchResults = cache(async (criteria: SearchCriteria): Promise<OccurrenceListing[]> => {
  const today = currentEventDay(new Date());
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true, filters: asParams(criteria) });
  return source.listOccurrences({ from: today, to: addDays(today, SEARCH_DAYS - 1) });
});
