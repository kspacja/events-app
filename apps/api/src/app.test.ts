import { describe, expect, it } from 'vitest';
import { createApp } from './app';

const PORTAL_ORIGIN = 'http://portal.test';
const app = createApp({ listOccurrences: async () => [], corsOrigin: PORTAL_ORIGIN });

describe('GET /health', () => {
  it('answers ok', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('lets the portal read the API from the browser', async () => {
    const response = await app.request('/occurrences?from=2030-01-01&to=2030-01-01', {
      headers: { Origin: PORTAL_ORIGIN },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(PORTAL_ORIGIN);
  });

  it('does not allow any other origin', async () => {
    const response = await app.request('/occurrences?from=2030-01-01&to=2030-01-01', {
      headers: { Origin: 'http://elsewhere.test' },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('http://elsewhere.test');
  });

  it('answers the preflight for GET', async () => {
    const response = await app.request('/occurrences', {
      method: 'OPTIONS',
      headers: { Origin: PORTAL_ORIGIN, 'Access-Control-Request-Method': 'GET' },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});
