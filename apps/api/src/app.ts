import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ListOccurrences } from './contexts/events/occurrences';
import { occurrencesRoute } from './contexts/events/occurrencesRoute';

export interface AppDependencies {
  readonly listOccurrences: ListOccurrences;
  readonly corsOrigin: string;
}

export function createApp({ listOccurrences, corsOrigin }: AppDependencies) {
  return new Hono()
    .use(cors({ origin: corsOrigin, allowMethods: ['GET'] }))
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', occurrencesRoute(listOccurrences));
}
