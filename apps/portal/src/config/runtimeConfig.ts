import 'server-only';

import { z } from 'zod';

export interface RuntimeConfig {
  readonly eventsApiUrl: string;
  readonly mocking: boolean;
}

export class RuntimeConfigError extends Error {
  constructor(problems: readonly string[]) {
    super(`Invalid runtime configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'RuntimeConfigError';
  }
}

// An empty `FOO=` line in a .env file means "not set"
const blankAsUnset = (value: unknown) => (value === '' ? undefined : value);

const envSchema = z.object({
  EVENTS_API_URL: z.preprocess(
    blankAsUnset,
    z.url({
      protocol: /^https?$/,
      error: 'must be set to a valid http(s) URL',
    }),
  ),
  API_MOCKING: z.string().optional().transform((value) => value === 'enabled'),
});

// Messages name the variable only, never its value, so secrets cannot leak into logs
function problemsOf(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

// Production (VERCEL_ENV, not NODE_ENV: local `next start` is also production) must never serve mocked data
function productionProblems(env: Readonly<Record<string, string | undefined>>): string[] {
  if (env.VERCEL_ENV === 'production' && env.API_MOCKING === 'enabled') {
    return ['API_MOCKING: enabled is not allowed in production'];
  }
  return [];
}

export function parseRuntimeConfig(env: Readonly<Record<string, string | undefined>>): RuntimeConfig {
  const forbidden = productionProblems(env);
  if (forbidden.length > 0) throw new RuntimeConfigError(forbidden);

  const result = envSchema.safeParse(env);
  if (!result.success) throw new RuntimeConfigError(problemsOf(result.error));

  return { eventsApiUrl: result.data.EVENTS_API_URL, mocking: result.data.API_MOCKING };
}

let cached: RuntimeConfig | undefined;

export function getRuntimeConfig(): RuntimeConfig {
  cached ??= parseRuntimeConfig(process.env);
  return cached;
}
