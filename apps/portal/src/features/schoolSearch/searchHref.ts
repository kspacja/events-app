import type { Venue } from '@events/contract/listing';
import { LOCALITY_PARAM, RADIUS_PARAM, type Place } from '@/features/locality/place';

/** Search results and the pages it leads to (stage 3.10). */
export const SEARCH_PATH = '/szukaj';
export const ORGANIZER_PATH = '/organizator';
export const EVENT_PAGE_PATH = '/wydarzenie';

/** In the page URL and, as is, in the request to the events API (only MSW reads them). */
export const KEYWORDS_PARAM = 'q';
export const VENUE_PARAM = 'miejsce';
export const ORGANIZER_PARAM = 'organizator';

/** Lower case without Polish marks, so "lodz" finds Łódź. */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** Prototype: a venue's name and city as one slug, until the listing's venue carries its own id. */
export function venueKey({ name, city }: Pick<Venue, 'name' | 'city'>): string {
  return foldText(`${name} ${city}`)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Keywords in a place and its radius, or in all of Poland with null. */
export function keywordsHref(keywords: string, place: Place | null): string {
  const params = new URLSearchParams({ [KEYWORDS_PARAM]: keywords.trim() });
  if (place) {
    params.set(LOCALITY_PARAM, place.localityId);
    params.set(RADIUS_PARAM, String(place.radiusKm));
  }
  return `${SEARCH_PATH}?${params}`;
}

export function venueHref(id: string): string {
  return `${SEARCH_PATH}?${new URLSearchParams({ [VENUE_PARAM]: id })}`;
}

export function organizerHref(slug: string): string {
  return `${ORGANIZER_PATH}/${slug}`;
}

export function eventPageHref(eventId: string): string {
  return `${EVENT_PAGE_PATH}/${eventId}`;
}
