import { describe, expect, it } from 'vitest';
import { shiftWeek } from './weekShift';

describe('shiftWeek', () => {
  it('moves to the next week, keeping its Monday', () => {
    expect(shiftWeek('2026-10-19', 1)).toEqual({ week: '2026-10-26', month: '2026-10' });
  });

  it('takes the month of the week, not of its Monday', () => {
    expect(shiftWeek('2026-10-26', 1)).toEqual({ week: '2026-11-02', month: '2026-11' });
  });

  it('moves to the previous week', () => {
    expect(shiftWeek('2026-10-19', -1)).toEqual({ week: '2026-10-12', month: '2026-10' });
  });
});
