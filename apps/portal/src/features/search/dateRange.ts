import {
  addDays,
  diffInDays,
  currentEventDay,
  DAYS_IN_WEEK,
  isCalendarDay,
  mondayOf,
  type CalendarDay,
} from '@events/time';
import { formatDay } from '@/features/format/format';

export const MAX_CUSTOM_RANGE_DAYS = 31;

export const DATE_PRESETS = ['today', 'tomorrow', 'week', 'weekend'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export interface DateRange {
  readonly from: CalendarDay;
  readonly to: CalendarDay;
}

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
  }
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

export function isDayInRange(day: CalendarDay, range: DateRange): boolean {
  return day >= range.from && day <= range.to;
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
