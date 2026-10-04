import { describe, expect, it } from 'vitest';
import { formatClock, formatLocalTime } from './format';

describe('formatLocalTime', () => {
  it('shows local time in summer and winter', () => {
    expect(formatLocalTime('2026-07-12T17:00:00Z')).toBe('19:00');
    expect(formatLocalTime('2026-01-12T18:00:00Z')).toBe('19:00');
  });
});

describe('formatClock', () => {
  it('pads hours and minutes', () => {
    expect(formatClock(9 * 60 + 5)).toBe('09:05');
    expect(formatClock(0)).toBe('00:00');
  });
});

