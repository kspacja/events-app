import { http, HttpResponse } from 'msw';
import { SIMILAR_EVENTS_LIMIT, type EventPageDetails } from '@events/contract/event-page';
import type { OccurrenceListing } from '@events/contract/listing';
import { compareListings } from '@events/contract/source';
import { currentEventDay, eventDayOf } from '@events/time';

type DetailsFor = (listing: OccurrenceListing) => EventPageDetails | undefined;

function shared(a: readonly string[] = [], b: readonly string[] = []): number {
  return a.filter((value) => b.includes(value)).length;
}

/** Prototype: how much two school events have in common — categories, ages, subjects and kind. */
export function similarity(a: OccurrenceListing['event'], b: OccurrenceListing['event']): number {
  return (
    shared(a.categories.map(({ slug }) => slug), b.categories.map(({ slug }) => slug)) * 2 +
    shared(a.school?.ages, b.school?.ages) +
    shared(a.school?.subjects, b.school?.subjects) * 2 +
    shared(a.school?.kinds, b.school?.kinds)
  );
}

/** The next occurrence from `today` of every other school event that shares something, best match first. */
export function similarTo(event: OccurrenceListing['event'], listings: readonly OccurrenceListing[], today: string): OccurrenceListing[] {
  const next = new Map<string, OccurrenceListing>();
  for (const listing of [...listings].sort(compareListings)) {
    const other = listing.event;
    if (other.id === event.id || !other.forSchools || eventDayOf(listing.startsAt) < today || next.has(other.id)) continue;
    next.set(other.id, listing);
  }
  return [...next.values()]
    .map((listing) => ({ listing, score: similarity(event, listing.event) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || compareListings(a.listing, b.listing))
    .slice(0, SIMILAR_EVENTS_LIMIT)
    .map(({ listing }) => listing);
}

/** `GET /events/:id`: every occurrence of the event, its page details and similar events; 404 for an unknown event. */
export function eventPageHandler(eventsApiUrl: string, getListings: () => readonly OccurrenceListing[], detailsFor: DetailsFor) {
  return http.get(`${eventsApiUrl}/events/:id`, ({ params }) => {
    const listings = getListings();
    const occurrences = listings.filter(({ event }) => event.id === params.id).sort(compareListings);
    if (occurrences.length === 0) return HttpResponse.json({ error: 'Not found.' }, { status: 404 });
    const details = detailsFor(occurrences[0]);
    return HttpResponse.json({
      occurrences,
      ...(details ? { details } : {}),
      similar: similarTo(occurrences[0].event, listings, currentEventDay(new Date())),
    });
  });
}
