import 'server-only';

import { z } from 'zod';

export const OCCURRENCE_SOURCES = ['http', 'memory'] as const;
export const DEFAULT_OCCURRENCE_SOURCE = 'http';

export type RuntimeConfig =
  | { readonly source: 'memory' }
  | {
      readonly source: 'http';
      readonly eventsApiUrl: string;
      readonly mocking: boolean;
    };

export class RuntimeConfigError extends Error {
  constructor(problems: readonly string[]) {
    super(`Invalid runtime configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'RuntimeConfigError';
  }
}

// An empty `FOO=` line in a .env file means "not set"
const blankAsUnset = (value: unknown) => (value === '' ? undefined : value);

const sourceEnvSchema = z.object({
  OCCURRENCE_SOURCE: z.preprocess(blankAsUnset, z.enum(OCCURRENCE_SOURCES).default(DEFAULT_OCCURRENCE_SOURCE)),
});

const httpEnvSchema = z.object({
  EVENTS_API_URL: z.preprocess(
    blankAsUnset,
    z.url({
      protocol: /^https?$/,
      error: 'must be set to a valid http(s) URL when OCCURRENCE_SOURCE=http',
    }),
  ),
  API_MOCKING: z.string().optional().transform((value) => value === 'enabled'),
});

// Messages name the variable only, never its value, so secrets cannot leak into logs
function problemsOf(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

export function parseRuntimeConfig(env: Readonly<Record<string, string | undefined>>): RuntimeConfig {
  const sourceResult = sourceEnvSchema.safeParse(env);
  if (!sourceResult.success) throw new RuntimeConfigError(problemsOf(sourceResult.error));

  if (sourceResult.data.OCCURRENCE_SOURCE === 'memory') return { source: 'memory' };

  const httpResult = httpEnvSchema.safeParse(env);
  if (!httpResult.success) throw new RuntimeConfigError(problemsOf(httpResult.error));

  return {
    source: 'http',
    eventsApiUrl: httpResult.data.EVENTS_API_URL,
    mocking: httpResult.data.API_MOCKING,
  };
}

let cached: RuntimeConfig | undefined;

export function getRuntimeConfig(): RuntimeConfig {
  cached ??= parseRuntimeConfig(process.env);
  return cached;
}
