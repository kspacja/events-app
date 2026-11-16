import { NodeSDK } from '@opentelemetry/sdk-node';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';

const env = process.env;
// Nothing leaves the process until a backend is chosen (ADR-0011); OTEL_TRACES_EXPORTER=console still works locally
const exportsTraces = Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTEL_TRACES_EXPORTER);
if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  env.OTEL_METRICS_EXPORTER ??= 'none';
  env.OTEL_LOGS_EXPORTER ??= 'none';
}
// With no processor the SDK would not start at all ("none" disables it); this one exports nothing but keeps real trace ids
const KEEP_IDS_ONLY = { onStart() {}, onEnd() {}, forceFlush: async () => {}, shutdown: async () => {} };
env.OTEL_TRACES_SAMPLER ??= 'parentbased_traceidratio';
env.OTEL_TRACES_SAMPLER_ARG ??= '0.5';
env.OTEL_SERVICE_NAME ??= 'events-portal';

// Undici is Node's fetch: its spans carry traceparent to the API, so one trace runs page → API → database
new NodeSDK({
  spanProcessors: exportsTraces ? undefined : [KEEP_IDS_ONLY],
  instrumentations: [new UndiciInstrumentation()],
}).start();
