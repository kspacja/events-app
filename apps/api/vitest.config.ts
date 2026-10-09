import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests need the Docker database; they run via test:integration
    exclude: ['src/**/*.integration.test.ts'],
  },
});
