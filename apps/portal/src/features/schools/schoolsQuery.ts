import { currentEventDay, isCalendarDay, type CalendarDay, type DateRange } from '@events/time';
import { scheduleSpan } from '@/features/events/schedule';
import { firstValue, type SearchParamsInput } from '@/lib/searchParams';
import { SCHOOLS_LABELS } from './labels';
import { isCalendarMonth, monthOf, type CalendarMonth } from './monthCalendar';

export interface SchoolsQuery {
  readonly day: CalendarDay;
  /** Monday to Sunday of the picked day. */
  readonly week: DateRange;
  readonly month: CalendarMonth;
  readonly notice: string | null;
}

function parseDay(raw: string | undefined, today: CalendarDay): { day: CalendarDay; notice: string | null } {
  if (raw === undefined) return { day: today, notice: null };
  if (!isCalendarDay(raw)) return { day: today, notice: SCHOOLS_LABELS.invalidDayNotice };
  if (raw < today) return { day: today, notice: SCHOOLS_LABELS.pastDayNotice };
  return { day: raw, notice: null };
}

function parseMonth(raw: string | undefined, today: CalendarDay, day: CalendarDay): CalendarMonth {
  const isShowable = raw !== undefined && isCalendarMonth(raw) && raw >= monthOf(today);
  return isShowable ? raw : monthOf(day);
}

/** The picked day (today when missing, invalid or past) and the shown month (the day's month when missing, invalid or past). */
export function parseSchoolsQuery(params: SearchParamsInput, now: Date): SchoolsQuery {
  const today = currentEventDay(now);
  const { day, notice } = parseDay(firstValue(params.day), today);
  return {
    day,
    week: scheduleSpan({ from: day, to: day }),
    month: parseMonth(firstValue(params.month), today, day),
    notice,
  };
}
