import { createSampleEvents } from '@events/repo';
import { parseApiConfig } from './config';
import { seedEvents } from './contexts/events/seed';
import { createDb } from './db';
import { assertLocalDatabase } from './localDatabase';

const { databaseUrl } = parseApiConfig(process.env);
assertLocalDatabase(databaseUrl);

const db = createDb(databaseUrl);
try {
  const data = createSampleEvents(new Date());
  await seedEvents(db, data);
  console.info(`Seeded ${data.events.length} events and ${data.occurrences.length} occurrences.`);
} finally {
  await db.$client.end();
}
