import { http, HttpResponse } from 'msw';
import { createSampleEvents, SAMPLE_LOCALITIES, toListings } from '@events/repo';
import type { OccurrenceListing, Organizer } from '@events/contract/listing';
import type { Locality, LocalityId } from '@events/contract/localities';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { eventDayOf, isDayInRange } from '@events/time';
import { hasFilters, matchesFilters, parseFilters, priceBands, priceModeOf, TRAIT_PARAMS, type FilterSelection } from '@/features/schools/schoolFilters';
import { LOCALITY_PARAM, parsePlace, RADIUS_PARAM, type Place } from '@/features/locality/place';
import { kmBetween, localitiesHandlers } from './localities';
import { SAMPLE_EVENT_ORGANIZERS, SAMPLE_ORGANIZERS } from './organizers';
import { searchHandlers, searchMatcher } from './schoolSearch';
import { SAMPLE_SCHOOL_TRAITS } from './schoolTraits';
import { SAMPLE_VENUE_LOCALITIES } from './venueLocalities';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

const NO_TRAITS: FilterSelection = {};

/** Cechy szkolne in the listing's own shape (stage 3.9); the real API does not send them yet. */
function withSchoolTraits(listing: OccurrenceListing, traits: FilterSelection | undefined): OccurrenceListing {
  if (!traits) return listing;
  const school = Object.fromEntries(
    Object.entries(TRAIT_PARAMS).map(([trait, param]) => [trait, traits[param] ?? []]),
  ) as Record<keyof typeof TRAIT_PARAMS, readonly string[]>;
  return { ...listing, event: { ...listing.event, school } };
}

/** Organizator in the listing's own shape (stage 3.10); the real API does not send it yet. */
function withOrganizer(listing: OccurrenceListing, organizer: Organizer | undefined): OccurrenceListing {
  return organizer ? { ...listing, event: { ...listing.event, organizer } } : listing;
}

/** What MSW needs to match a place: the dictionary and each venue's Miejscowość, keyed by `venue.city`. */
export interface PlaceData {
  readonly localities: readonly Locality[];
  readonly venueLocalities: Readonly<Record<string, LocalityId>>;
}

/** Radius 0 keeps the venues of the Miejscowość itself; otherwise venues within the radius of its centre. Unknown id: nothing. */
function placeMatcher(place: Place | null, { localities, venueLocalities }: PlaceData): (venue: OccurrenceListing['venue']) => boolean {
  if (!place) return () => true;
  const centre = localities.find(({ id }) => id === place.localityId);
  if (!centre) return () => false;
  if (place.radiusKm === 0) return (venue) => venueLocalities[venue.city] === centre.id;
  return (venue) => kmBetween(centre, venue) <= place.radiusKm;
}

/**
 * Serves the listings whose event day is in the validated range, for schools or the general programme; ordering is left to the adapter.
 * Prototype: school filter params narrow school listings by traits only MSW knows, `miejscowosc` and `zasieg` by distance,
 * `q`, `miejsce` and `organizator` by search (stage 3.10); the real API ignores them.
 */
export function occurrencesHandler(
  eventsApiUrl: string,
  getListings: () => readonly OccurrenceListing[],
  schoolTraits: Readonly<Record<string, FilterSelection>> = {},
  placeData: PlaceData = { localities: [], venueLocalities: {} },
  organizers: Readonly<Record<string, Organizer>> = {},
) {
  return http.get(`${eventsApiUrl}/occurrences`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = occurrencesQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      forSchools: params.get('forSchools') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { forSchools, ...range } = parsed.data;
    const filters = forSchools ? parseFilters(params) : NO_TRAITS;
    const inPlace = placeMatcher(parsePlace(params.get(LOCALITY_PARAM) ?? '', params.get(RADIUS_PARAM) ?? ''), placeData);
    const found = searchMatcher(params);
    return HttpResponse.json({
      occurrences: getListings()
        .map((listing) => withOrganizer(withSchoolTraits(listing, schoolTraits[listing.event.id]), organizers[listing.event.id]))
        .filter(found)
        .filter(
          ({ startsAt, event, price, venue }) =>
            event.forSchools === forSchools &&
            inPlace(venue) &&
            isDayInRange(eventDayOf(startsAt), range) &&
            // The price band comes from the listing itself, the other traits only from MSW
            (!hasFilters(filters) ||
              matchesFilters({ ...(schoolTraits[event.id] ?? NO_TRAITS), cena: priceBands(price, priceModeOf(filters)) }, filters)),
        ),
    });
  });
}

export function createHandlers(eventsApiUrl: string) {
  const sampleListings = () => toListings(createSampleEvents(new Date()));
  return [
    occurrencesHandler(
      eventsApiUrl,
      sampleListings,
      SAMPLE_SCHOOL_TRAITS,
      { localities: SAMPLE_LOCALITIES, venueLocalities: SAMPLE_VENUE_LOCALITIES },
      SAMPLE_EVENT_ORGANIZERS,
    ),
    ...localitiesHandlers(eventsApiUrl, SAMPLE_LOCALITIES),
    ...searchHandlers(eventsApiUrl, SAMPLE_ORGANIZERS, sampleListings),
  ];
}
