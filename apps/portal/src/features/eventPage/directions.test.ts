import { describe, expect, it } from 'vitest';
import { directionsHref } from './directions';

describe('directionsHref', () => {
  it('leads to Google Maps with the destination filled in and public transport chosen', () => {
    const url = new URL(directionsHref({ lat: 51.1067, lng: 17.077 }));

    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('destination')).toBe('51.1067,17.077');
    expect(url.searchParams.get('travelmode')).toBe('transit');
    expect(url.searchParams.has('origin')).toBe(false);
  });
});
