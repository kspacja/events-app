import { NodeSDK } from '@opentelemetry/sdk-node';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';

const env = process.env;
// No export without a backend (ADR-0011), except the local console exporter
const exportsTraces = Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT) || env.OTEL_TRACES_EXPORTER === 'console';
if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  env.OTEL_METRICS_EXPORTER ??= 'none';
  env.OTEL_LOGS_EXPORTER ??= 'none';
}
// Keeps real trace ids without exporting anything ("none" would stop the SDK)
const noExportSpanProcessor = { onStart() {}, onEnd() {}, forceFlush: async () => {}, shutdown: async () => {} };
env.OTEL_TRACES_SAMPLER ??= 'parentbased_traceidratio';
env.OTEL_TRACES_SAMPLER_ARG ??= '0.5';
env.OTEL_SERVICE_NAME ??= 'events-portal';

// Undici is Node's fetch: its spans carry traceparent to the API, so one trace runs page → API → database
new NodeSDK({
  spanProcessors: exportsTraces ? undefined : [noExportSpanProcessor],
  instrumentations: [new UndiciInstrumentation()],
}).start();
