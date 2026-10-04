import { http, HttpResponse } from 'msw';
import { createSampleCatalog, listOccurrences } from '@events/catalog';
import type { OccurrenceListing } from '@events/contract/listing';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import type { DateRange } from '@events/time';

function badRequest(error: string) {
  return HttpResponse.json({ error }, { status: 400 });
}

/** Serves what `listForRange` returns for the validated range, in the HTTP transport shape. */
export function occurrencesHandler(
  eventsApiUrl: string,
  listForRange: (range: DateRange) => readonly OccurrenceListing[],
) {
  return http.get(`${eventsApiUrl}/occurrences`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const parsed = occurrencesQuerySchema.safeParse({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    });
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    return HttpResponse.json({ occurrences: listForRange(parsed.data) });
  });
}

export function createHandlers(eventsApiUrl: string) {
  return [occurrencesHandler(eventsApiUrl, (range) => listOccurrences(createSampleCatalog(new Date()), range))];
}
