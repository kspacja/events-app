import { http, HttpResponse } from 'msw';
import { EVENTS_API_URL } from '@/config/env';
import { occurrencesQuerySchema } from '@events/contract/occurrences';
import { eventDayOf } from '@events/time';
import { generateOccurrences } from './data/occurrences';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

export const handlers = [
  http.get(`${EVENTS_API_URL}/occurrences`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = occurrencesQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);
    const range = parsed.data;

    const occurrences = generateOccurrences()
      .filter((occurrence) => {
        const day = eventDayOf(occurrence.startsAt);
        return day >= range.from && day <= range.to;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    return HttpResponse.json({ occurrences });
  }),
];
