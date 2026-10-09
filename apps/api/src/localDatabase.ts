import { parse } from 'pg-connection-string';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Guards destructive dev scripts (seed) from ever running against a hosted database. */
export function assertLocalDatabase(databaseUrl: string): void {
  // Read the host the way the pg driver does: `?host=` overrides the URL's hostname
  const { host, hostaddr } = parse(databaseUrl);
  if (host === null || !LOCAL_HOSTS.has(host) || hostaddr !== undefined) {
    throw new Error('Refusing to run: DATABASE_URL must point at localhost.');
  }
}
