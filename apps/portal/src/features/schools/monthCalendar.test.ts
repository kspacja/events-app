import { describe, expect, it } from 'vitest';
import type { CalendarDay } from '@events/time';
import { addMonths, buildMonthCalendar, countByDay, isCalendarMonth, monthOfWeek, weeksOf } from './monthCalendar';

// Wednesday; October 2026 starts on a Thursday
const TODAY: CalendarDay = '2026-10-14';
const CURRENT_WEEK: CalendarDay = '2026-10-12';

describe('months', () => {
  it.each(['2026-10', '2030-01'])('accepts %s', (value) => {
    expect(isCalendarMonth(value)).toBe(true);
  });

  it.each(['2026-13', '2026-1', '26-10', '2026-10-01'])('rejects %s', (value) => {
    expect(isCalendarMonth(value)).toBe(false);
  });

  it('steps across years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2027-01', -1)).toBe('2026-12');
  });

  it('puts a week in the month of its Thursday', () => {
    expect(monthOfWeek('2026-09-28')).toBe('2026-10');
    expect(monthOfWeek('2026-10-26')).toBe('2026-10');
    expect(monthOfWeek('2026-11-30')).toBe('2026-12');
  });
});

describe('countByDay', () => {
  it('counts per event day, so the night before 04:00 belongs to the day before', () => {
    const counts = countByDay([
      { startsAt: '2026-10-14T10:00:00+02:00' },
      { startsAt: '2026-10-14T18:00:00+02:00' },
      { startsAt: '2026-10-15T01:30:00+02:00' },
    ]);

    expect(Object.fromEntries(counts)).toEqual({ '2026-10-14': 3 });
  });
});

describe('weeksOf', () => {
  it('covers the month with weeks from Monday, neighbours included', () => {
    expect(weeksOf('2026-10')).toEqual(['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  });

  it('needs six rows when the month starts late in the week', () => {
    expect(weeksOf('2026-08')).toHaveLength(6);
  });

  it('needs only four rows for a February starting on Monday', () => {
    expect(weeksOf('2027-02')).toHaveLength(4);
  });
});

describe('buildMonthCalendar', () => {
  const calendar = buildMonthCalendar({ month: '2026-10', today: TODAY, selectedWeek: '2026-10-19' });
  const cell = (day: CalendarDay) => calendar.weeks.flatMap(({ days }) => days).find((found) => found.day === day);

  it('marks the current and the selected week separately', () => {
    const flags = calendar.weeks.map(({ monday, isCurrent, isSelected }) => [monday, isCurrent, isSelected]);

    expect(flags).toContainEqual([CURRENT_WEEK, true, false]);
    expect(flags).toContainEqual(['2026-10-19', false, true]);
  });

  it('greys out days before today', () => {
    expect(cell('2026-10-13')).toMatchObject({ isPast: true, isToday: false });
  });

  it('spots today', () => {
    expect(cell(TODAY)).toMatchObject({ isPast: false, isToday: true });
  });

  it('tells days of the neighbouring months apart', () => {
    expect(cell('2026-09-30')?.inMonth).toBe(false);
    expect(cell('2026-10-01')?.inMonth).toBe(true);
  });

  it('does not go back before the current month', () => {
    expect(calendar.previous).toBeNull();
  });

  it('always goes forward', () => {
    expect(calendar.next).toBe('2026-11');
  });

  it('highlights the shown week', () => {
    const shown = buildMonthCalendar({ month: '2026-10', today: TODAY, selectedWeek: '2026-10-19' });

    expect(shown.weeks.find(({ isSelected }) => isSelected)?.monday).toBe('2026-10-19');
  });

  it('goes back once the shown month is ahead', () => {
    const november = buildMonthCalendar({ month: '2026-11', today: TODAY, selectedWeek: CURRENT_WEEK });

    expect(november.previous).toBe('2026-10');
  });
});
