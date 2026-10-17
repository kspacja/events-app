import { describe, expect, it } from 'vitest';
import { firstOpenDay, isPastWeek, shiftWeek } from './weekShift';

describe('shiftWeek', () => {
  it('moves to the next week, keeping its Monday', () => {
    expect(shiftWeek('2026-10-19', 1)).toBe('2026-10-26');
  });

  it('moves to the previous week', () => {
    expect(shiftWeek('2026-10-19', -1)).toBe('2026-10-12');
  });
});

describe('isPastWeek', () => {
  it('is past once its Sunday is before today', () => {
    expect(isPastWeek('2026-10-12', '2026-10-19')).toBe(true);
  });

  it('is not past while its Sunday is today', () => {
    expect(isPastWeek('2026-10-12', '2026-10-18')).toBe(false);
  });
});

describe('firstOpenDay', () => {
  it('lands on today within the current week', () => {
    expect(firstOpenDay('2026-10-12', '2026-10-17')).toBe('2026-10-17');
  });

  it('lands on Monday in a future week', () => {
    expect(firstOpenDay('2026-10-19', '2026-10-17')).toBe('2026-10-19');
  });
});
