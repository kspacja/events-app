import { trace } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';
import { logger } from './logger';

const dsn = process.env.SENTRY_DSN;
// Errors only: traces stay in OpenTelemetry, so Sentry must not set up its own (ADR-0011)
if (dsn) Sentry.init({ dsn, skipOpenTelemetrySetup: true });

/** Logs the error with its cause and trace id, and sends it to Sentry once a DSN is set. */
export function logError(error: unknown, message: string, context: Record<string, unknown> = {}): void {
  logger.error({ ...context, err: error }, message);
  if (dsn) Sentry.captureException(error);
}

/** Body of a 500: the cause stays in the server log, the client gets only the trace id to report it by. */
export function unavailableBody() {
  return { error: 'The programme is temporarily unavailable.', traceId: trace.getActiveSpan()?.spanContext().traceId };
}
