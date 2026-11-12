import { describe, expect, it } from 'vitest';
import type { CalendarDay } from '@events/time';
import type { ScheduleDay, ScheduleEntry } from '@/features/events/schedule';
import { formatPassedWeeks, splitPassedWeeks, weekJumpsOf } from './monthWeeks';

function week(monday: string, firstInMonth: number, eventsPerDay: number) {
  return Array.from({ length: 7 }, (_, offset): ScheduleDay => {
    const day = `2026-11-${String(Number(monday.slice(8)) + offset).padStart(2, '0')}` as CalendarDay;
    const inRange = offset >= firstInMonth;
    return {
      day,
      weekdayIndex: offset,
      inRange,
      isWeekend: offset >= 5,
      entries: Array.from({ length: eventsPerDay }, () => ({ active: inRange }) as ScheduleEntry),
    };
  });
}

describe('splitPassedWeeks', () => {
  it('hides the weeks that have fully passed and counts their events in the month', () => {
    const weeks = [week('2026-11-02', 0, 1), week('2026-11-09', 0, 1), week('2026-11-16', 0, 1)];

    const { shown, passed } = splitPassedWeeks(weeks, '2026-11-12');

    expect(shown.map((w) => w[0].day)).toEqual(['2026-11-09', '2026-11-16']);
    expect(passed).toEqual({ range: { from: '2026-11-02', to: '2026-11-08' }, count: 7 });
  });

  it('leaves no note when the hidden weeks had nothing', () => {
    const weeks = [week('2026-11-02', 0, 0), week('2026-11-09', 0, 1)];

    expect(splitPassedWeeks(weeks, '2026-11-12').passed).toBeNull();
  });

  it('keeps the current week even when some of its days are gone', () => {
    const weeks = [week('2026-11-09', 0, 1)];

    expect(splitPassedWeeks(weeks, '2026-11-15').shown).toHaveLength(1);
  });
});

describe('formatPassedWeeks', () => {
  it('agrees the verb with the count', () => {
    const range = { from: '2026-11-02', to: '2026-11-08' } as const;

    expect(formatPassedWeeks({ range, count: 1 })).toBe('2—8.11 · 1 wydarzenie minęło');
    expect(formatPassedWeeks({ range, count: 3 })).toBe('2—8.11 · 3 wydarzenia minęły');
    expect(formatPassedWeeks({ range, count: 12 })).toBe('2—8.11 · 12 wydarzeń minęło');
  });
});

describe('weekJumpsOf', () => {
  it('jumps to the first day with events of each week, or nowhere when it has none', () => {
    expect(weekJumpsOf([week('2026-11-02', 6, 1), week('2026-11-09', 0, 0)], '2026-11-02')).toEqual([
      { label: '8.11', target: '2026-11-08' },
      { label: '9—15.11', target: null },
    ]);
  });

  it('skips the days already gone, as phones hide them', () => {
    expect(weekJumpsOf([week('2026-11-09', 0, 1)], '2026-11-12')).toEqual([{ label: '9—15.11', target: '2026-11-12' }]);
  });
});
