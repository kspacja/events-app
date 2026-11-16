import { register } from 'node:module';

// Loaded with --import before the app: ESM imports of http and pg are patched only through this hook
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

const env = process.env;
// Nothing leaves the process until a backend is chosen (ADR-0011); spans still give logs their trace ids
if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  env.OTEL_TRACES_EXPORTER ??= 'none';
  env.OTEL_METRICS_EXPORTER ??= 'none';
  env.OTEL_LOGS_EXPORTER ??= 'none';
}
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
  instrumentations: [new HttpInstrumentation(), new PgInstrumentation(), new PinoInstrumentation()],
}).start();
