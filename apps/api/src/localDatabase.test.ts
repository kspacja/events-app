import { describe, expect, it } from 'vitest';
import { assertLocalDatabase } from './localDatabase';

describe('assertLocalDatabase', () => {
  it.each(['postgres://u:p@localhost:5432/events', 'postgres://u:p@127.0.0.1/events', 'postgres://u:p@[::1]:5432/events'])(
    'allows %s',
    (url) => {
      expect(() => assertLocalDatabase(url)).not.toThrow();
    },
  );

  it.each(['postgres://u:p@ep-cool-1.eu-central-1.aws.neon.tech/events', 'postgres://u:p@localhost.evil.com/events'])(
    'refuses %s',
    (url) => {
      expect(() => assertLocalDatabase(url)).toThrow('localhost');
    },
  );
});
