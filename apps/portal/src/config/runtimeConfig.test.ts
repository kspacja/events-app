import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig, RuntimeConfigError, type RuntimeConfig } from './runtimeConfig';

const API_URL = 'http://api.events.local';

describe('parseRuntimeConfig', () => {
  const accepted: ReadonlyArray<readonly [string, Record<string, string>, RuntimeConfig]> = [
    ['http with a URL', { OCCURRENCE_SOURCE: 'http', EVENTS_API_URL: API_URL }, { source: 'http', eventsApiUrl: API_URL, mocking: false }],
    ['the default source is http', { EVENTS_API_URL: API_URL }, { source: 'http', eventsApiUrl: API_URL, mocking: false }],
    ['a blank source is the default', { OCCURRENCE_SOURCE: '', EVENTS_API_URL: API_URL }, { source: 'http', eventsApiUrl: API_URL, mocking: false }],
    ['http with mocking', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled' }, { source: 'http', eventsApiUrl: API_URL, mocking: true }],
    ['mocking is only the exact value "enabled"', { EVENTS_API_URL: API_URL, API_MOCKING: 'true' }, { source: 'http', eventsApiUrl: API_URL, mocking: false }],
    ['http in production', { EVENTS_API_URL: API_URL, VERCEL_ENV: 'production' }, { source: 'http', eventsApiUrl: API_URL, mocking: false }],
    ['memory in preview', { OCCURRENCE_SOURCE: 'memory', VERCEL_ENV: 'preview' }, { source: 'memory' }],
    ['mocking outside production', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'development' }, { source: 'http', eventsApiUrl: API_URL, mocking: true }],
    ['memory needs no URL', { OCCURRENCE_SOURCE: 'memory' }, { source: 'memory' }],
    ['memory ignores URL and mocking', { OCCURRENCE_SOURCE: 'memory', EVENTS_API_URL: 'not-a-url', API_MOCKING: 'enabled' }, { source: 'memory' }],
  ];

  it.each(accepted)('accepts %s', (_name, env, expected) => {
    expect(parseRuntimeConfig(env)).toEqual(expected);
  });

  const rejected: ReadonlyArray<readonly [string, Record<string, string>, string]> = [
    ['http without a URL', { OCCURRENCE_SOURCE: 'http' }, 'EVENTS_API_URL'],
    ['the default source without a URL', {}, 'EVENTS_API_URL'],
    ['a blank URL', { EVENTS_API_URL: '' }, 'EVENTS_API_URL'],
    ['an invalid URL', { OCCURRENCE_SOURCE: 'http', EVENTS_API_URL: 'not-a-url' }, 'EVENTS_API_URL'],
    ['a non-http URL', { EVENTS_API_URL: 'ftp://api.events.local' }, 'EVENTS_API_URL'],
    ['memory in production', { OCCURRENCE_SOURCE: 'memory', VERCEL_ENV: 'production' }, 'OCCURRENCE_SOURCE'],
    ['mocking in production', { EVENTS_API_URL: API_URL, API_MOCKING: 'enabled', VERCEL_ENV: 'production' }, 'API_MOCKING'],
    ['an unknown source', { OCCURRENCE_SOURCE: 'carrier-pigeon', EVENTS_API_URL: API_URL }, 'OCCURRENCE_SOURCE'],
  ];

  it.each(rejected)('rejects %s', (_name, env, variable) => {
    expect(() => parseRuntimeConfig(env)).toThrow(RuntimeConfigError);
    expect(() => parseRuntimeConfig(env)).toThrow(variable);
  });

  it('does not echo the rejected value', () => {
    expect(() => parseRuntimeConfig({ EVENTS_API_URL: 'secret-token' })).not.toThrow(/secret-token/);
    expect(() => parseRuntimeConfig({ OCCURRENCE_SOURCE: 'secret-token' })).not.toThrow(/secret-token/);
  });
});
