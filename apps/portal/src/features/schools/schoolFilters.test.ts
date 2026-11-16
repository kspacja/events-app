import { describe, expect, it } from 'vitest';
import {
  filtersQuery,
  hasFilters,
  matchesFilters,
  parseFilters,
  priceBands,
  priceModeOf,
  toggleOption,
  withPeople,
  withPriceMode,
  withoutPlacement,
} from './schoolFilters';

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

describe('price per group', () => {
  const paid = (from: number, per?: 'person' | 'group' | 'hour') => ({ kind: 'paid' as const, from, to: null, currency: 'PLN' as const, ...(per ? { per } : {}) });
  const group = (people: number) => ({ per: 'grupa' as const, people });

  it('puts a group or hourly price in no band per pupil', () => {
    expect(priceBands(paid(350, 'group'))).toEqual([]);
    expect(priceBands(paid(120, 'hour'))).toEqual([]);
  });

  it('multiplies a pupil price by the pupils when comparing per group', () => {
    expect(priceBands(paid(15), group(25))).toEqual(['do-600']);
    expect(priceBands(paid(10), group(25))).toEqual(['do-300', 'do-600']);
    expect(priceBands(paid(15), group(60))).toEqual(['ponad-600']);
  });

  it('compares a group price and an hour as they are', () => {
    expect(priceBands(paid(350, 'group'), group(25))).toEqual(['do-600']);
    expect(priceBands(paid(120, 'hour'), group(40))).toEqual(['do-300', 'do-600']);
  });

  it('keeps the mode and the pupils in the URL, after the price', () => {
    const selection = parseFilters(new URLSearchParams('cena=do-600&cenaZa=grupa&osob=30&wiek=1-3'));

    expect(priceModeOf(selection)).toEqual({ per: 'grupa', people: 30 });
    expect(filtersQuery(selection)).toBe('?wiek=1-3&cena=do-600&cenaZa=grupa&osob=30');
  });

  it('drops options of the other mode and keeps the pupils in range', () => {
    expect(parseFilters(new URLSearchParams('cena=do-20&cenaZa=grupa&osob=9999'))).toEqual({ cenaZa: ['grupa'], osob: ['500'] });
  });

  it('clears the chosen bands when the mode changes', () => {
    const perPupil = parseFilters(new URLSearchParams('cena=do-20&wiek=1-3'));

    expect(withPriceMode(perPupil, 'grupa')).toEqual({ wiek: ['1-3'], cenaZa: ['grupa'], osob: ['25'] });
    expect(withPriceMode(withPriceMode(perPupil, 'grupa'), 'osoba')).toEqual({ wiek: ['1-3'] });
  });

  it('keeps "free" when the mode changes, since it means the same in both', () => {
    expect(withPriceMode(parseFilters(new URLSearchParams('cena=bezplatne,do-20')), 'grupa')).toEqual({
      cena: ['bezplatne'],
      cenaZa: ['grupa'],
      osob: ['25'],
    });
  });

  it('rounds a fractional count and falls back for an unreadable one', () => {
    expect(priceModeOf(parseFilters(new URLSearchParams('cenaZa=grupa&osob=12.6'))).people).toBe(13);
    expect(priceModeOf(parseFilters(new URLSearchParams('cenaZa=grupa&osob=abc'))).people).toBe(25);
  });

  it('changes the pupils and does not count the mode as a filter', () => {
    const selection = withPeople(withPriceMode({}, 'grupa'), 40);

    expect(priceModeOf(selection).people).toBe(40);
    expect(hasFilters(selection)).toBe(false);
    expect(matchesFilters({}, selection)).toBe(true);
  });
});
