import { describe, expect, it } from 'vitest';
import { parsePlace, widerRadius } from './place';

describe('parsePlace', () => {
  it('reads a SIMC id and a known radius', () => {
    expect(parsePlace('0986283', '0')).toEqual({ localityId: '0986283', radiusKm: 0 });
  });

  it.each(['', 'abc', '7', '-5'])('falls back to 25 km for radius %j', (radius) => {
    expect(parsePlace('0986283', radius)?.radiusKm).toBe(25);
  });

  it.each(['', '986283', '09862830', 'wroclaw'])('ignores locality %j', (locality) => {
    expect(parsePlace(locality, '10')).toBeNull();
  });
});

describe('widerRadius', () => {
  it('steps to the next radius and stops at the widest', () => {
    expect(widerRadius(0)).toBe(5);
    expect(widerRadius(25)).toBe(50);
    expect(widerRadius(100)).toBeNull();
  });
});
