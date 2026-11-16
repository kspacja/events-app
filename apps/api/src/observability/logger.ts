import { pino } from 'pino';

/** JSON lines; the pino instrumentation adds trace_id and span_id of the active span. */
export const logger = pino({
  base: { service: 'events-api' },
  level: process.env.LOG_LEVEL ?? 'info',
  // Personal data never reaches the logs (ADR-0011)
  redact: {
    paths: ['email', '*.email', 'ip', '*.ip', 'guestId', '*.guestId', 'headers.cookie', 'headers.authorization', 'err.params'],
    censor: '[redacted]',
  },
});
