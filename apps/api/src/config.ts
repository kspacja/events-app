import { z } from 'zod';

const DEFAULT_PORT = 3001;

export interface ApiConfig {
  readonly databaseUrl: string;
  readonly port: number;
}

export class ApiConfigError extends Error {
  constructor(problems: readonly string[]) {
    super(`Invalid API configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ApiConfigError';
  }
}

// An empty `FOO=` line in a .env file means "not set"
const blankAsUnset = (value: unknown) => (value === '' ? undefined : value);

const envSchema = z.object({
  DATABASE_URL: z.preprocess(
    blankAsUnset,
    z.url({ protocol: /^postgres(ql)?$/, error: 'must be set to a valid postgres:// URL' }),
  ),
  PORT: z.preprocess(blankAsUnset, z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT)),
});

// Messages name the variable only, never its value, so the database password cannot leak into logs
export function parseApiConfig(env: Readonly<Record<string, string | undefined>>): ApiConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ApiConfigError(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
  }
  return { databaseUrl: result.data.DATABASE_URL, port: result.data.PORT };
}
