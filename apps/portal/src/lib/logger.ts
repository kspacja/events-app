import 'server-only';
import { trace } from '@opentelemetry/api';
import { pino } from 'pino';

const base = pino({
  base: { service: 'events-portal' },
  level: process.env.LOG_LEVEL ?? 'info',
  serializers: { error: pino.stdSerializers.err },
  // Read the span here: the pino instrumentation cannot patch a bundled pino
  mixin() {
    const context = trace.getActiveSpan()?.spanContext();
    return context ? { trace_id: context.traceId, span_id: context.spanId } : {};
  },
  // Personal data never reaches the logs (ADR-0011)
  redact: { paths: ['email', '*.email', 'ip', '*.ip', 'guestId', '*.guestId'], censor: '[redacted]' },
});

/** JSON lines with the active trace id. */
export const logger = {
  error(message: string, context?: Record<string, unknown>): void {
    base.error(context ?? {}, message);
  },
};
