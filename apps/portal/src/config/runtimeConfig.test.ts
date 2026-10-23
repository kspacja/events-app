import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig, RuntimeConfigError, type RuntimeConfig } from './runtimeConfig';

const API_URL = 'http://api.events.local';

describe('parseRuntimeConfig', () => {
  const accepted: ReadonlyArray<readonly [string, Record<string, string>, RuntimeConfig]> = [
    ['a URL', { EVENTS_API_URL: API_URL }, { eventsApiUrl: API_URL, mocking: false }],
    ['a URL with mocking', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled' }, { eventsApiUrl: API_URL, mocking: true }],
    ['mocking is only the exact value "enabled"', { EVENTS_API_URL: API_URL, API_MOCKING: 'true' }, { eventsApiUrl: API_URL, mocking: false }],
    ['a URL in production', { EVENTS_API_URL: API_URL, VERCEL_ENV: 'production' }, { eventsApiUrl: API_URL, mocking: false }],
    ['mocking in production when allowed', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'production', ALLOW_PRODUCTION_MOCKING: 'yes' }, { eventsApiUrl: API_URL, mocking: true }],
    ['mocking outside production', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'development' }, { eventsApiUrl: API_URL, mocking: true }],
  ];

  it.each(accepted)('accepts %s', (_name, env, expected) => {
    expect(parseRuntimeConfig(env)).toEqual(expected);
  });

  const rejected: ReadonlyArray<readonly [string, Record<string, string>, string]> = [
    ['a missing URL', {}, 'EVENTS_API_URL'],
    ['a blank URL', { EVENTS_API_URL: '' }, 'EVENTS_API_URL'],
    ['an invalid URL', { EVENTS_API_URL: 'not-a-url' }, 'EVENTS_API_URL'],
    ['a non-http URL', { EVENTS_API_URL: 'ftp://api.events.local' }, 'EVENTS_API_URL'],
    ['mocking in production', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'production' }, 'API_MOCKING'],
    ['mocking in production allowed only by the exact value "yes"', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'production', ALLOW_PRODUCTION_MOCKING: 'true' }, 'API_MOCKING'],
  ];

  it.each(rejected)('rejects %s', (_name, env, variable) => {
    expect(() => parseRuntimeConfig(env)).toThrow(RuntimeConfigError);
    expect(() => parseRuntimeConfig(env)).toThrow(variable);
  });

  it('does not echo the rejected value', () => {
    expect(() => parseRuntimeConfig({ EVENTS_API_URL: 'secret-token' })).not.toThrow(/secret-token/);
  });
});
