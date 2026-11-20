import { describe, expect, it } from 'vitest';
import { keywordsHref, venueKey } from './searchHref';

describe('venueKey', () => {
  it('joins the name and city into one slug without Polish marks', () => {
    expect(venueKey({ name: 'Plaża Jelitkowo', city: 'Gdańsk' })).toBe('plaza-jelitkowo-gdansk');
    expect(venueKey({ name: 'Ostrów Tumski', city: 'Wrocław' })).toBe('ostrow-tumski-wroclaw');
  });
});

describe('keywordsHref', () => {
  it('keeps the place and radius, or leaves them out for all of Poland', () => {
    expect(keywordsHref(' film ', { localityId: '0986283', radiusKm: 25 })).toBe('/szukaj?q=film&miejscowosc=0986283&zasieg=25');
    expect(keywordsHref('kino letnie', null)).toBe('/szukaj?q=kino+letnie');
  });
});
