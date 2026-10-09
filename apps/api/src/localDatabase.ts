const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Guards destructive dev scripts (seed) from ever running against a hosted database. */
export function assertLocalDatabase(databaseUrl: string): void {
  if (!LOCAL_HOSTS.has(new URL(databaseUrl).hostname)) {
    throw new Error('Refusing to run: DATABASE_URL must point at localhost.');
  }
}
