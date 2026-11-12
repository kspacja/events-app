import { describe, expect, it } from 'vitest';
import { monthFromPath } from './monthParam';

describe('monthFromPath', () => {
  it('keeps the current or a later month', () => {
    expect(monthFromPath('2026-11', '2026-11-12')).toBe('2026-11');
    expect(monthFromPath('2027-02', '2026-11-12')).toBe('2027-02');
  });

  it('gives the current month for a month that has passed', () => {
    expect(monthFromPath('2026-10', '2026-11-12')).toBe('2026-11');
  });

  it('gives the current month for an unreadable one', () => {
    expect(monthFromPath('2026-13', '2026-11-12')).toBe('2026-11');
    expect(monthFromPath('listopad', '2026-11-12')).toBe('2026-11');
  });
});
