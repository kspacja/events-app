import { describe, expect, it } from 'vitest';
import { ApiConfigError, parseApiConfig, type ApiConfig } from './config';

const DATABASE_URL = 'postgres://events:events@localhost:5432/events';
const DEFAULT_CORS_ORIGIN = 'http://localhost:3000';

describe('parseApiConfig', () => {
  const accepted: ReadonlyArray<readonly [string, Record<string, string>, ApiConfig]> = [
    ['a URL with the default port', { DATABASE_URL }, { databaseUrl: DATABASE_URL, port: 3001, corsOrigin: DEFAULT_CORS_ORIGIN }],
    ['a blank port as the default', { DATABASE_URL, PORT: '' }, { databaseUrl: DATABASE_URL, port: 3001, corsOrigin: DEFAULT_CORS_ORIGIN }],
    ['an explicit port', { DATABASE_URL, PORT: '8080' }, { databaseUrl: DATABASE_URL, port: 8080, corsOrigin: DEFAULT_CORS_ORIGIN }],
    ['the postgresql:// scheme', { DATABASE_URL: 'postgresql://db/events' }, { databaseUrl: 'postgresql://db/events', port: 3001, corsOrigin: DEFAULT_CORS_ORIGIN }],
    [
      'a CORS origin',
      { DATABASE_URL, CORS_ORIGIN: 'https://portal.example' },
      { databaseUrl: DATABASE_URL, port: 3001, corsOrigin: 'https://portal.example' },
    ],
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
    ['a CORS origin with a path', { DATABASE_URL, CORS_ORIGIN: 'https://portal.example/app' }, 'CORS_ORIGIN'],
    ['a non-http CORS origin', { DATABASE_URL, CORS_ORIGIN: 'ftp://portal.example' }, 'CORS_ORIGIN'],
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
