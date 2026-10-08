import { Hono } from 'hono';

export function createApp() {
  return new Hono().get('/health', (c) => c.json({ status: 'ok' }));
}
