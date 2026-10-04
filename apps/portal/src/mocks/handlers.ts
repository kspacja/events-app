import { http, HttpResponse } from 'msw';
import { EVENTS_API_URL } from '@/config/env';
import type { OccurrenceListing } from '@events/contract/listing';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { compareListings } from '@events/contract/source';
import { eventDayOf, isDayInRange } from '@events/time';
import { generateOccurrences } from './data/occurrences';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

/** Serves the listings the way the real API must: event days in range, sorted. */
export function occurrencesHandler(getListings: () => readonly OccurrenceListing[]) {
  return http.get(`${EVENTS_API_URL}/occurrences`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = occurrencesQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);
    const range = parsed.data;

    const occurrences = getListings()
      .filter(({ startsAt }) => isDayInRange(eventDayOf(startsAt), range))
      .sort(compareListings);

    return HttpResponse.json({ occurrences });
  });
}

export const handlers = [occurrencesHandler(() => generateOccurrences())];
