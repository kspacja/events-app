import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { createDb } from '../db';
import { assertLocalDatabase } from '../localDatabase';
import { TEST_DATABASE_URL } from './integrationDatabase';

const SAFE_DATABASE_NAME = /^[a-z0-9_]+$/;
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

// Creates the test database next to the dev one if missing, then migrates it
export default async function setup(): Promise<void> {
  assertLocalDatabase(TEST_DATABASE_URL);
  const target = new URL(TEST_DATABASE_URL);
  const name = target.pathname.slice(1);
  if (!SAFE_DATABASE_NAME.test(name)) throw new Error('TEST_DATABASE_URL must name a plain database.');

  const maintenance = new URL(TEST_DATABASE_URL);
  maintenance.pathname = '/postgres';
  const client = new pg.Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const existing = await client.query('select 1 from pg_database where datname = $1', [name]);
    if (existing.rowCount === 0) await client.query(`create database "${name}"`);
  } finally {
    await client.end();
  }

  const db = createDb(TEST_DATABASE_URL);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await db.$client.end();
  }
}
