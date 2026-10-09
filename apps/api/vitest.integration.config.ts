import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['./src/test/integrationSetup.ts'],
    // One shared database, so files must not run at the same time
    fileParallelism: false,
  },
});
