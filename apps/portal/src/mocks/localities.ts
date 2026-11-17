import { http, HttpResponse } from 'msw';
import {
  LOCALITY_HINTS_LIMIT,
  localitiesQuerySchema,
  localityIdSchema,
  type Locality,
} from '@events/contract/localities';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance; the API does the same in SQL (haversine). */
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Lower case without Polish marks, so "lodz" finds Łódź; the API does the same with `unaccent`. */
export function searchKey(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

export interface Indexed {
  readonly locality: Locality;
  readonly name: string;
  readonly place: readonly string[];
}

export function indexLocalities(localities: readonly Locality[]): readonly Indexed[] {
  return localities.map((locality) => ({
    locality,
    name: searchKey(locality.name),
    place: searchKey(`${locality.commune} ${locality.county}`).split(/\s+/),
  }));
}

/**
 * The name starts with the query; words the name does not cover narrow by commune or county ("nowa wies tyczyn").
 * Exact names come first, then cities, then shorter names.
 */
export function searchLocalities(indexed: readonly Indexed[], query: string): { localities: Locality[]; total: number } {
  const words = searchKey(query).split(/\s+/);
  const matches = indexed.filter(({ name, place }) => {
    for (let cut = words.length; cut > 0; cut--) {
      if (!name.startsWith(words.slice(0, cut).join(' '))) continue;
      const rest = words.slice(cut);
      if (rest.every((word) => place.some((part) => part.startsWith(word)))) return true;
    }
    return false;
  });
  const exact = words.join(' ');
  const rank = ({ name, locality }: Indexed) => [name === exact ? 0 : 1, locality.kind === 'city' ? 0 : 1, name.length] as const;
  matches.sort((a, b) => {
    const [ra, rb] = [rank(a), rank(b)];
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2] || a.name.localeCompare(b.name, 'pl');
  });
  return { localities: matches.slice(0, LOCALITY_HINTS_LIMIT).map(({ locality }) => locality), total: matches.length };
}

/** Prototype dictionary of Miejscowości (stage 3.8): a PRNG sample, until the API serves the full one. */
export function localitiesHandlers(eventsApiUrl: string, localities: readonly Locality[]) {
  const indexed = indexLocalities(localities);
  const byId = new Map(localities.map((locality) => [locality.id, locality]));
  return [
    http.get(`${eventsApiUrl}/localities`, ({ request }) => {
      const parsed = localitiesQuerySchema.safeParse({ q: new URL(request.url).searchParams.get('q') ?? undefined });
      if (!parsed.success) return HttpResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      return HttpResponse.json(searchLocalities(indexed, parsed.data.q));
    }),
    http.get(`${eventsApiUrl}/localities/:id`, ({ params }) => {
      const id = localityIdSchema.safeParse(params.id);
      const locality = id.success ? byId.get(id.data) : undefined;
      if (!locality) return HttpResponse.json({ error: 'Locality not found.' }, { status: 404 });
      return HttpResponse.json({ locality });
    }),
  ];
}
