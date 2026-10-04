import 'server-only';

const PREFIX = '[events]';

export const logger = {
  error(message: string, context?: Record<string, unknown>): void {
    console.error(`${PREFIX} ${message}`, context ?? {});
  },
};
