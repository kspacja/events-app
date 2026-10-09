import { http, HttpResponse } from 'msw';
import { createSampleEvents, toListings } from '@events/repo';
import type { OccurrenceListing } from '@events/contract/listing';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { eventDayOf, isDayInRange } from '@events/time';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

/** Serves the listings whose event day is in the validated range, for schools or the general programme; ordering is left to the adapter. */
export function occurrencesHandler(eventsApiUrl: string, getListings: () => readonly OccurrenceListing[]) {
  return http.get(`${eventsApiUrl}/occurrences`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = occurrencesQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      forSchools: params.get('forSchools') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { forSchools, ...range } = parsed.data;
    return HttpResponse.json({
      occurrences: getListings().filter(
        ({ startsAt, event }) => event.forSchools === forSchools && isDayInRange(eventDayOf(startsAt), range),
      ),
    });
  });
}

export function createHandlers(eventsApiUrl: string) {
  return [occurrencesHandler(eventsApiUrl, () => toListings(createSampleEvents(new Date())))];
}
