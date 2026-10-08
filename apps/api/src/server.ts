import { serve } from '@hono/node-server';
import { createApp } from './app';
import { parseApiConfig } from './config';

const config = parseApiConfig(process.env);

serve({ fetch: createApp().fetch, port: config.port }, ({ port }) => {
  console.info(`API listening on http://localhost:${port}`);
});
