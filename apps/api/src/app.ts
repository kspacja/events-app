import { Hono } from 'hono';
import type { ListOccurrences } from './contexts/events/occurrences';
import { occurrencesRoute } from './contexts/events/occurrencesRoute';

export interface AppDependencies {
  readonly listOccurrences: ListOccurrences;
}

export function createApp({ listOccurrences }: AppDependencies) {
  return new Hono()
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', occurrencesRoute(listOccurrences));
}
