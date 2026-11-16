import { describe, expect, it } from 'vitest';
import { filtersQuery, matchesFilters, parseFilters, priceBands, toggleOption, withoutPlacement } from './schoolFilters';

describe('parseFilters', () => {
  it('keeps known options in config order and drops the rest', () => {
    expect(parseFilters(new URLSearchParams('wiek=7-8,nope,1-3&przedmiot=&inne=x'))).toEqual({ wiek: ['1-3', '7-8'] });
  });

  it('reads Next search params, including repeated ones', () => {
    expect(parseFilters({ wiek: ['4-6', '1-3'], rodzaj: 'cykliczne' })).toEqual({
      wiek: ['1-3', '4-6'],
      rodzaj: ['cykliczne'],
    });
  });
});

describe('filtersQuery', () => {
  it('writes filters in config order with readable commas', () => {
    expect(filtersQuery({ przedmiot: ['fizyka'], wiek: ['1-3', '4-6'] })).toBe('?wiek=1-3,4-6&przedmiot=fizyka');
  });

  it('is empty without filters', () => {
    expect(filtersQuery({})).toBe('');
  });
});

describe('toggleOption', () => {
  it('adds and removes an option', () => {
    const added = toggleOption({}, 'wiek', '4-6');
    expect(added).toEqual({ wiek: ['4-6'] });
    expect(toggleOption(added, 'wiek', '4-6')).toEqual({});
  });
});

describe('withoutPlacement', () => {
  it('clears only the filters of one placement', () => {
    expect(withoutPlacement({ wiek: ['1-3'], rodzaj: ['cykliczne'] }, 'advanced')).toEqual({ wiek: ['1-3'] });
  });
});

describe('matchesFilters', () => {
  const traits = { wiek: ['4-6', '7-8'], przedmiot: ['fizyka'] };

  it('matches any option within a filter', () => {
    expect(matchesFilters(traits, { wiek: ['1-3', '7-8'] })).toBe(true);
  });

  it('needs every filter to match', () => {
    expect(matchesFilters(traits, { wiek: ['7-8'], przedmiot: ['historia'] })).toBe(false);
  });

  it('does not match a filter the event has no traits for', () => {
    expect(matchesFilters(traits, { rodzaj: ['cykliczne'] })).toBe(false);
  });
});

describe('priceBands', () => {
  const paid = (from: number, to: number | null = null) => ({ kind: 'paid' as const, from, to, currency: 'PLN' as const });

  it('puts a free event only in its own band', () => {
    expect(priceBands({ kind: 'free' })).toEqual(['bezplatne']);
  });

  it('counts a price up to 20 zł in both overlapping bands', () => {
    expect(priceBands(paid(20))).toEqual(['do-20', 'do-30']);
  });

  it('counts a range by its lowest price', () => {
    expect(priceBands(paid(25, 45))).toEqual(['do-30']);
  });

  it('puts a price above 30 zł in the top band', () => {
    expect(priceBands(paid(30.5))).toEqual(['ponad-30']);
  });

  it('has no band without a price', () => {
    expect(priceBands(null)).toEqual([]);
  });
});
