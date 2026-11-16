import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
// Errors only: traces stay in OpenTelemetry, so Sentry must not set up its own (ADR-0011)
if (dsn) Sentry.init({ dsn, skipOpenTelemetrySetup: true });

/** Sends the error to Sentry once a DSN is set; the log line is written by the caller. */
export function reportError(error: unknown): void {
  if (dsn) Sentry.captureException(error);
}
