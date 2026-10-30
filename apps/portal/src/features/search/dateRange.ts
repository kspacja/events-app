import {
  addDays,
  diffInDays,
  currentEventDay,
  DAYS_IN_WEEK,
  isCalendarDay,
  mondayOf,
  type CalendarDay,
  type DateRange,
} from '@events/time';
import { formatDay } from '@/lib/format';

export const MAX_CUSTOM_RANGE_DAYS = 31;

export const DATE_PRESETS = ['today', 'tomorrow', 'week', 'weekend', 'nextWeek'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export type DateSearchError =
  | 'invalid-preset'
  | 'invalid-format'
  | 'invalid-order'
  | 'range-too-long';

export type DateSearchResult =
  | {
      readonly source: 'preset';
      readonly preset: DatePreset;
      readonly range: DateRange;
      readonly error: DateSearchError | null;
    }
  | {
      readonly source: 'custom';
      readonly range: DateRange;
      readonly error: null;
    };

export function resolvePreset(
  preset: DatePreset,
  now: Date,
): DateRange {
  const today = currentEventDay(now);
  const monday = mondayOf(today);
  const sunday = addDays(monday, DAYS_IN_WEEK - 1);

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'tomorrow': {
      const tomorrow = addDays(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case 'week':
      return { from: monday, to: sunday };
    case 'weekend': {
      const saturday = addDays(monday, 5);
      return { from: today > saturday ? today : saturday, to: sunday };
    }
    case 'nextWeek':
      return { from: addDays(monday, DAYS_IN_WEEK), to: addDays(sunday, DAYS_IN_WEEK) };
  }
}

/** The range one step earlier or later: a single day moves by a day, longer ranges by whole weeks, so a weekend stays a weekend. */
export function shiftRange(range: DateRange, direction: 1 | -1): DateRange {
  const length = diffInDays(range.from, range.to) + 1;
  const step = length === 1 ? 1 : Math.ceil(length / DAYS_IN_WEEK) * DAYS_IN_WEEK;
  return { from: addDays(range.from, step * direction), to: addDays(range.to, step * direction) };
}

export function validateCustomRange(
  from: string,
  to: string,
): { range: DateRange } | { error: DateSearchError } {
  if (!isCalendarDay(from) || !isCalendarDay(to)) {
    return { error: 'invalid-format' };
  }
  const length = diffInDays(from, to);
  if (length < 0) return { error: 'invalid-order' };
  if (length + 1 > MAX_CUSTOM_RANGE_DAYS) return { error: 'range-too-long' };
  return { range: { from, to } };
}

/** Monday-Sunday weeks that overlap the range, each as a list of days. */
export function weeksCovering(range: DateRange): CalendarDay[][] {
  const firstMonday = mondayOf(range.from);
  const lastMonday = mondayOf(range.to);
  const weekCount = diffInDays(firstMonday, lastMonday) / DAYS_IN_WEEK + 1;

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, day) =>
      addDays(firstMonday, week * DAYS_IN_WEEK + day),
    ),
  );
}

const RANGE_SEPARATOR = '—';

export function formatRangeLabel({ from, to }: DateRange): string {
  const dayMonth = (day: CalendarDay) => formatDay(day, 'd.MM');
  const fullDate = (day: CalendarDay) => formatDay(day, 'd.MM.yyyy');

  if (from === to) return dayMonth(to);
  if (formatDay(from, 'yyyy') !== formatDay(to, 'yyyy')) {
    return `${fullDate(from)}${RANGE_SEPARATOR}${fullDate(to)}`;
  }
  if (formatDay(from, 'MM') === formatDay(to, 'MM')) {
    return `${formatDay(from, 'd')}${RANGE_SEPARATOR}${dayMonth(to)}`;
  }
  return `${dayMonth(from)}${RANGE_SEPARATOR}${dayMonth(to)}`;
}
