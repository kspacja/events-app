import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
// Errors only: traces stay in OpenTelemetry, so Sentry must not set up its own (ADR-0011)
if (dsn) Sentry.init({ dsn, skipOpenTelemetrySetup: true });
