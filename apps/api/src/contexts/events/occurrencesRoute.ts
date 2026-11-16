import { trace } from '@opentelemetry/api';
import { Hono } from 'hono';
import { occurrencesQuerySchema } from '@events/contract/occurrences-http';
import { reportError } from '../../observability/errors';
import { logger } from '../../observability/logger';
import type { ListOccurrences } from './occurrences';

const UNAVAILABLE = 'The programme is temporarily unavailable.';

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
      // The cause stays in the server log; the client gets only the trace id to report it by
      logger.error({ err: error }, 'Listing occurrences failed');
      reportError(error);
      return c.json({ error: UNAVAILABLE, traceId: trace.getActiveSpan()?.spanContext().traceId }, 500);
    }
  });
}
