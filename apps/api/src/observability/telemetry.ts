import { register } from 'node:module';

// Loaded with --import before the app: ESM imports of http and pg are patched only through this hook
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

const env = process.env;
// No export without a backend (ADR-0011), except the local console exporter
const exportsTraces = Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT) || env.OTEL_TRACES_EXPORTER === 'console';
if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  env.OTEL_METRICS_EXPORTER ??= 'none';
  env.OTEL_LOGS_EXPORTER ??= 'none';
}
// Keeps real trace ids without exporting anything ("none" would stop the SDK)
const noExportSpanProcessor = { onStart() {}, onEnd() {}, forceFlush: async () => {}, shutdown: async () => {} };
// Half of the traces, following the portal's decision when it sends one
env.OTEL_TRACES_SAMPLER ??= 'parentbased_traceidratio';
env.OTEL_TRACES_SAMPLER_ARG ??= '0.5';
env.OTEL_SERVICE_NAME ??= 'events-api';

const [{ NodeSDK }, { HttpInstrumentation }, { PgInstrumentation }, { PinoInstrumentation }] = await Promise.all([
  import('@opentelemetry/sdk-node'),
  import('@opentelemetry/instrumentation-http'),
  import('@opentelemetry/instrumentation-pg'),
  import('@opentelemetry/instrumentation-pino'),
]);

new NodeSDK({
  spanProcessors: exportsTraces ? undefined : [noExportSpanProcessor],
  instrumentations: [
    // Undefined drops the attribute: no client IP addresses in traces (ADR-0011)
    new HttpInstrumentation({ startIncomingSpanHook: () => ({ 'client.address': undefined, 'network.peer.address': undefined }) }),
    new PgInstrumentation(),
    new PinoInstrumentation(),
  ],
}).start();
