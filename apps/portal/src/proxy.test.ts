import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const MONTH = 'http://localhost/dla-szkol/miesiac/2026-12';

function visit(url: string, cookie = '') {
  return proxy(new NextRequest(url, { headers: cookie ? { cookie } : {} }));
}

describe('proxy: the default Miejscowość', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('leaves a URL that names a Miejscowość alone', () => {
    expect(visit(`${MONTH}?miejscowosc=0950463&zasieg=10`).headers.get('location')).toBeNull();
  });

  it('brings back the last choice, keeping the other filters', () => {
    const response = visit(`${MONTH}?wiek=1-3`, 'miejscowosc=0950463; zasieg=10');
    expect(response.headers.get('location')).toBe(`${MONTH}?wiek=1-3&miejscowosc=0950463&zasieg=10`);
  });

  it('keeps all of Poland when that was chosen', () => {
    vi.stubEnv('API_MOCKING', 'enabled');
    expect(visit(MONTH, 'miejscowosc=cala-polska').headers.get('location')).toBeNull();
  });

  it('guesses Wrocław on MSW and marks it as a guess', () => {
    vi.stubEnv('API_MOCKING', 'enabled');
    const response = visit(MONTH);
    expect(response.headers.get('location')).toBe(`${MONTH}?miejscowosc=0986283&zasieg=25`);
    expect(response.cookies.get('miejscowosc-zgadnieta')?.value).toBe('0986283');
  });

  it('guesses nothing without MSW yet', () => {
    vi.stubEnv('API_MOCKING', '');
    expect(visit(MONTH).headers.get('location')).toBeNull();
  });
});
