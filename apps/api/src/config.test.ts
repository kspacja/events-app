import { describe, expect, it } from 'vitest';
import { ApiConfigError, parseApiConfig, type ApiConfig } from './config';

const DATABASE_URL = 'postgres://events:events@localhost:5432/events';

describe('parseApiConfig', () => {
  const accepted: ReadonlyArray<readonly [string, Record<string, string>, ApiConfig]> = [
    ['a URL with the default port', { DATABASE_URL }, { databaseUrl: DATABASE_URL, port: 3001 }],
    ['a blank port as the default', { DATABASE_URL, PORT: '' }, { databaseUrl: DATABASE_URL, port: 3001 }],
    ['an explicit port', { DATABASE_URL, PORT: '8080' }, { databaseUrl: DATABASE_URL, port: 8080 }],
    ['the postgresql:// scheme', { DATABASE_URL: 'postgresql://db/events' }, { databaseUrl: 'postgresql://db/events', port: 3001 }],
  ];

  it.each(accepted)('accepts %s', (_name, env, expected) => {
    expect(parseApiConfig(env)).toEqual(expected);
  });

  const rejected: ReadonlyArray<readonly [string, Record<string, string>, string]> = [
    ['a missing URL', {}, 'DATABASE_URL'],
    ['a blank URL', { DATABASE_URL: '' }, 'DATABASE_URL'],
    ['a non-postgres URL', { DATABASE_URL: 'http://localhost:5432' }, 'DATABASE_URL'],
    ['a non-numeric port', { DATABASE_URL, PORT: 'abc' }, 'PORT'],
    ['an out-of-range port', { DATABASE_URL, PORT: '70000' }, 'PORT'],
  ];

  it.each(rejected)('rejects %s', (_name, env, variable) => {
    expect(() => parseApiConfig(env)).toThrow(ApiConfigError);
    expect(() => parseApiConfig(env)).toThrow(variable);
  });

  it('does not echo the rejected value', () => {
    expect(() => parseApiConfig({ DATABASE_URL: 'mysql://user:secret-password@host/db' })).not.toThrow(
      /secret-password/,
    );
  });
});
