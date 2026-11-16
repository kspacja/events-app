import { serve } from '@hono/node-server';
import { createApp } from './app';
import { parseApiConfig } from './config';
import { createOccurrenceReader } from './contexts/events/occurrences';
import { createDb } from './db';
import { logger } from './observability/logger';

const config = parseApiConfig(process.env);
const db = createDb(config.databaseUrl);
const app = createApp({ listOccurrences: createOccurrenceReader(db), corsOrigin: config.corsOrigin });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  logger.info({ port }, 'API listening');
});
