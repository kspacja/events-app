import { describe, expect, it } from 'vitest';
import { formatWeekCount, upcomingCount } from './weekCount';

describe('upcomingCount', () => {
  it('counts today and the days after it', () => {
    const days = { '2026-10-26': 4, '2026-10-29': 2, '2026-10-30': 3, '2026-10-31': 1 };
    expect(upcomingCount(days, '2026-10-30')).toBe(4);
  });
});

describe('formatWeekCount', () => {
  it.each([
    [19, null, '19 wydarzeń'],
    [19, 19, '19 wydarzeń'],
    [19, 1, '1 nadchodzące · 19 w tygodniu'],
    [19, 3, '3 nadchodzące · 19 w tygodniu'],
    [19, 5, '5 nadchodzących · 19 w tygodniu'],
    [19, 0, '0 nadchodzących · 19 w tygodniu'],
  ])('formats %i with %s upcoming', (total, upcoming, label) => {
    expect(formatWeekCount(total, upcoming)).toBe(label);
  });
});
