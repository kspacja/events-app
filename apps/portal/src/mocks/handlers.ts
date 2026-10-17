import { http, HttpResponse } from 'msw';
import { createSampleEvents, toListings } from '@events/repo';
import type { OccurrenceListing } from '@events/contract/listing';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { eventDayOf, isDayInRange } from '@events/time';
import { hasFilters, matchesFilters, parseFilters, type FilterSelection } from '@/features/schools/schoolFilters';
import { SAMPLE_SCHOOL_TRAITS } from './schoolTraits';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

const NO_TRAITS: FilterSelection = {};

/**
 * Serves the listings whose event day is in the validated range, for schools or the general programme; ordering is left to the adapter.
 * Prototype: school filter params narrow school listings by traits only MSW knows; the real API ignores them.
 */
export function occurrencesHandler(
  eventsApiUrl: string,
  getListings: () => readonly OccurrenceListing[],
  schoolTraits: Readonly<Record<string, FilterSelection>> = {},
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
    return HttpResponse.json({
      occurrences: getListings().filter(
        ({ startsAt, event }) =>
          event.forSchools === forSchools &&
          isDayInRange(eventDayOf(startsAt), range) &&
          (!hasFilters(filters) || matchesFilters(schoolTraits[event.id] ?? NO_TRAITS, filters)),
      ),
    });
  });
}

export function createHandlers(eventsApiUrl: string) {
  return [occurrencesHandler(eventsApiUrl, () => toListings(createSampleEvents(new Date())), SAMPLE_SCHOOL_TRAITS)];
}
