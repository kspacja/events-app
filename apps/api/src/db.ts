import { drizzle } from 'drizzle-orm/node-postgres';
import * as eventsTables from './contexts/events/schema';

export function createDb(databaseUrl: string) {
  return drizzle(databaseUrl, { schema: eventsTables });
}

export type Db = ReturnType<typeof createDb>;
