import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';
import { parseApiConfig } from './src/config';

// drizzle-kit does not read .env on its own
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/contexts/*/schema.ts',
  out: './drizzle',
  schemaFilter: ['events'],
  dbCredentials: { url: parseApiConfig(process.env).databaseUrl },
});
