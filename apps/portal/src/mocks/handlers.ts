import { http, HttpResponse } from 'msw';
import { EVENTS_API_URL } from '@/config/env';
import { eventsQuerySchema } from '@events/contract/events';
import { eventDayOf } from '@events/contract/time';
import { generateEvents } from './data/events';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

export const handlers = [
  http.get(`${EVENTS_API_URL}/events`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = eventsQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);
    const range = parsed.data;

    const events = generateEvents()
      .filter((event) => {
        const day = eventDayOf(event.startsAt);
        return day >= range.from && day <= range.to;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    return HttpResponse.json({ events });
  }),
];
