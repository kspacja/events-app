import { http, HttpResponse } from 'msw';
import type { OccurrenceListing, Organizer } from '@events/contract/listing';
import { SEARCH_HINTS_LIMIT, searchQuerySchema, type VenueHint } from '@events/contract/search';
import { foldText, KEYWORDS_PARAM, ORGANIZER_PARAM, VENUE_PARAM, venueKey } from '@/features/schoolSearch/searchHref';

/** Every word of the query appears in the title, description, categories, venue or organizer. */
export function matchesKeywords(listing: OccurrenceListing, keywords: string): boolean {
  const { event, venue } = listing;
  const haystack = foldText(
    [event.title, event.description ?? '', ...event.categories.map(({ label }) => label), venue.name, venue.city, event.organizer?.name ?? ''].join(' '),
  );
  return foldText(keywords)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** `q`, `miejsce` and `organizator` of `GET /occurrences`; absent ones narrow nothing. */
export function searchMatcher(params: URLSearchParams): (listing: OccurrenceListing) => boolean {
  const keywords = params.get(KEYWORDS_PARAM) ?? '';
  const venue = params.get(VENUE_PARAM);
  const organizer = params.get(ORGANIZER_PARAM);
  return (listing) =>
    (keywords === '' || matchesKeywords(listing, keywords)) &&
    (venue === null || venueKey(listing.venue) === venue) &&
    (organizer === null || listing.event.organizer?.slug === organizer);
}

/** Names whose word starts with the query, shortest first. */
function byName<T extends { name: string }>(items: readonly T[], query: string): T[] {
  const words = foldText(query).split(/\s+/);
  return items
    .filter(({ name }) => {
      const nameWords = foldText(name).split(/[^a-z0-9]+/);
      return words.every((word) => nameWords.some((part) => part.startsWith(word)));
    })
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, SEARCH_HINTS_LIMIT);
}

/** Venues of school events only: the search lives on the schools pages. */
function schoolVenues(listings: readonly OccurrenceListing[]): VenueHint[] {
  const venues = new Map<string, VenueHint>();
  for (const { event, venue } of listings) {
    if (!event.forSchools) continue;
    const id = venueKey(venue);
    if (!venues.has(id)) venues.set(id, { id, name: venue.name, city: venue.city });
  }
  return [...venues.values()];
}

export function searchHandlers(eventsApiUrl: string, organizers: readonly Organizer[], getListings: () => readonly OccurrenceListing[]) {
  return [
    http.get(`${eventsApiUrl}/search/suggestions`, ({ request }) => {
      const parsed = searchQuerySchema.safeParse({ q: new URL(request.url).searchParams.get('q') ?? undefined });
      if (!parsed.success) return HttpResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      return HttpResponse.json({
        organizers: byName(organizers, parsed.data.q),
        venues: byName(schoolVenues(getListings()), parsed.data.q),
      });
    }),
    http.get(`${eventsApiUrl}/organizers/:slug`, ({ params }) => {
      const organizer = organizers.find(({ slug }) => slug === params.slug);
      return organizer ? HttpResponse.json({ organizer }) : HttpResponse.json({ error: 'Not found.' }, { status: 404 });
    }),
  ];
}
