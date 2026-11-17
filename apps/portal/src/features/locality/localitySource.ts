import 'server-only';

import {
  localitiesResponseSchema,
  localityResponseSchema,
  type Locality,
  type LocalityId,
} from '@events/contract/localities';
import { cache } from 'react';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { logger } from '@/lib/logger';

const REQUEST_TIMEOUT_MS = 5000;
// The dictionary changes once a year; 0 in dev, so changed sample data shows up on reload
const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 0 : 24 * 60 * 60;

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${getRuntimeConfig().eventsApiUrl}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Localities API responded with ${response.status}`);
  return response.json();
}

/** The Miejscowość of a link; null when unknown or the API fails, so the page falls back to all of Poland. */
export const findLocality = cache(async (id: LocalityId): Promise<Locality | null> => {
  try {
    const body = await getJson(`/localities/${id}`);
    return body === null ? null : localityResponseSchema.parse(body).locality;
  } catch (error: unknown) {
    logger.error('Locality lookup failed', { id, error });
    return null;
  }
});

export async function searchLocalities(query: string) {
  return localitiesResponseSchema.parse(await getJson(`/localities?${new URLSearchParams({ q: query })}`));
}
