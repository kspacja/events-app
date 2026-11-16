import { Hono } from 'hono';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { logError, unavailableBody } from '../../observability/errors';
import type { ListOccurrences } from './occurrences';

export function occurrencesRoute(listOccurrences: ListOccurrences) {
  return new Hono().get('/occurrences', async (c) => {
    const parsed = occurrencesQuerySchema.safeParse({
      from: c.req.query('from'),
      to: c.req.query('to'),
      forSchools: c.req.query('forSchools'),
    });
    if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

    try {
      return c.json({ occurrences: await listOccurrences(parsed.data) });
    } catch (error: unknown) {
      logError(error, 'Listing occurrences failed');
      return c.json(unavailableBody(), 500);
    }
  });
}
