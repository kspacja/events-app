import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { LOG_LEVEL: 'silent' },
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['./src/test/integrationSetup.ts'],
    // One shared database, so files must not run at the same time
    fileParallelism: false,
  },
});
