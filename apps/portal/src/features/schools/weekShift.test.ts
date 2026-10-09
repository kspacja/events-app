import { describe, expect, it } from 'vitest';
import { shiftWeek } from './weekShift';

describe('shiftWeek', () => {
  it('moves to the next week, keeping its Monday', () => {
    expect(shiftWeek('2026-10-19', 1)).toBe('2026-10-26');
  });

  it('moves to the previous week', () => {
    expect(shiftWeek('2026-10-19', -1)).toBe('2026-10-12');
  });
});
