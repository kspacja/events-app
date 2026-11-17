import { describe, expect, it } from 'vitest';
import type { Locality } from '@events/contract/localities';
import { emptyInPlaceLabel, radiusLabel, whereLabel } from './labels';

const at = (overrides: Partial<Locality>): Locality => ({
  id: '0000001',
  name: 'Nowa Wieś',
  kind: 'village',
  commune: 'Tyczyn',
  county: 'rzeszowski',
  voivodeship: 'podkarpackie',
  lat: 50,
  lng: 22,
  ...overrides,
});

describe('whereLabel', () => {
  it('names the commune and county of a village', () => {
    expect(whereLabel(at({}))).toBe('gm. Tyczyn, pow. rzeszowski');
  });

  it('names the voivodeship of a city with its own county', () => {
    expect(whereLabel(at({ name: 'Wrocław', kind: 'city', commune: 'Wrocław', county: 'Wrocław', voivodeship: 'dolnośląskie' }))).toBe(
      'dolnośląskie',
    );
  });
});

describe('radius labels', () => {
  it('says "tylko tu" for the Miejscowość alone', () => {
    expect(radiusLabel(0)).toBe('tylko tu');
    expect(radiusLabel(25)).toBe('do 25 km');
  });

  it('keeps the name in the nominative in the empty month', () => {
    expect(emptyInPlaceLabel('Sobótka', 5)).toBe('Brak wydarzeń w promieniu 5 km od miejscowości Sobótka');
    expect(emptyInPlaceLabel('Sobótka', 0)).toBe('Brak wydarzeń w miejscowości Sobótka');
  });
});
