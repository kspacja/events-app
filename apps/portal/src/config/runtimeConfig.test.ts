import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig, RuntimeConfigError, type RuntimeConfig } from './runtimeConfig';

const URL_ = 'http://api.events.local';

describe('parseRuntimeConfig', () => {
  const accepted: ReadonlyArray<readonly [string, Record<string, string>, RuntimeConfig]> = [
    ['http with a URL', { OCCURRENCE_SOURCE: 'http', EVENTS_API_URL: URL_ }, { source: 'http', eventsApiUrl: URL_, mocking: false }],
    ['the default source is http', { EVENTS_API_URL: URL_ }, { source: 'http', eventsApiUrl: URL_, mocking: false }],
    ['a blank source is the default', { OCCURRENCE_SOURCE: '', EVENTS_API_URL: URL_ }, { source: 'http', eventsApiUrl: URL_, mocking: false }],
    ['http with mocking', { EVENTS_API_URL: URL_, API_MOCKING: 'enabled' }, { source: 'http', eventsApiUrl: URL_, mocking: true }],
    ['mocking is only the exact value "enabled"', { EVENTS_API_URL: URL_, API_MOCKING: 'true' }, { source: 'http', eventsApiUrl: URL_, mocking: false }],
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
    ['an unknown source', { OCCURRENCE_SOURCE: 'carrier-pigeon', EVENTS_API_URL: URL_ }, 'OCCURRENCE_SOURCE'],
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
