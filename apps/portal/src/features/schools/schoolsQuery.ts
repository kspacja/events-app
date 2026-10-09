import { currentEventDay, isCalendarDay, type CalendarDay } from '@events/time';
import type { SearchParamsInput } from '@/features/search/searchQuery';
import { SCHOOLS_LABELS } from './labels';
import { isCalendarMonth, monthOf, type CalendarMonth } from './monthCalendar';

export interface SchoolsQuery {
  readonly day: CalendarDay;
  readonly month: CalendarMonth;
  readonly notice: string | null;
}

function firstValue(value: string | readonly string[] | undefined) {
  return typeof value === 'string' ? value : value?.[0];
}

function parseDay(raw: string | undefined, today: CalendarDay): { day: CalendarDay; notice: string | null } {
  if (raw === undefined) return { day: today, notice: null };
  if (!isCalendarDay(raw)) return { day: today, notice: SCHOOLS_LABELS.invalidDayNotice };
  if (raw < today) return { day: today, notice: SCHOOLS_LABELS.pastDayNotice };
  return { day: raw, notice: null };
}

/** The picked day (today when missing, invalid or past) and the shown month (the day's month when missing or past). */
export function parseSchoolsQuery(params: SearchParamsInput, now: Date): SchoolsQuery {
  const today = currentEventDay(now);
  const { day, notice } = parseDay(firstValue(params.day), today);
  const rawMonth = firstValue(params.month);
  const month = rawMonth !== undefined && isCalendarMonth(rawMonth) && rawMonth >= monthOf(today) ? rawMonth : monthOf(day);
  return { day, month, notice };
}
