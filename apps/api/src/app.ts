import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { ListOccurrences } from './contexts/events/occurrences';
import { occurrencesRoute } from './contexts/events/occurrencesRoute';
import { logError, unavailableBody } from './observability/errors';

export interface AppDependencies {
  readonly listOccurrences: ListOccurrences;
  readonly corsOrigin: string;
}

export function createApp({ listOccurrences, corsOrigin }: AppDependencies) {
  return new Hono()
    .use(cors({ origin: corsOrigin, allowMethods: ['GET'] }))
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', occurrencesRoute(listOccurrences))
    .onError((error, c) => {
      if (error instanceof HTTPException) return error.getResponse();
      logError(error, 'Unhandled error', { method: c.req.method, path: c.req.path });
      return c.json(unavailableBody(), 500);
    });
}
