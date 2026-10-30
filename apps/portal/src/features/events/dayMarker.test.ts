import { describe, expect, it } from 'vitest';
import { calendarDayMarker, dayMarker } from './dayMarker';

describe('dayMarker', () => {
  it.each([
    [0, null],
    [1, { dots: 1, more: 0 }],
    [4, { dots: 4, more: 0 }],
    [5, { dots: 3, more: 2 }],
    [12, { dots: 3, more: 9 }],
  ])('marks %i events as %o', (count, marker) => {
    expect(dayMarker(count)).toEqual(marker);
  });
});

describe('calendarDayMarker', () => {
  it.each([
    [0, null],
    [3, { dots: 3, more: 0 }],
    [4, { dots: 1, more: 3 }],
    [6, { dots: 1, more: 5 }],
  ])('marks %i events as %o', (count, marker) => {
    expect(calendarDayMarker(count)).toEqual(marker);
  });
});
