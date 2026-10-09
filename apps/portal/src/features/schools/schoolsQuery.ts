import { currentEventDay, isCalendarDay, mondayOf, type CalendarDay, type DateRange } from '@events/time';
import { scheduleSpan } from '@/features/events/schedule';
import { firstValue, type SearchParamsInput } from '@/lib/searchParams';
import { SCHOOLS_LABELS } from './labels';
import { isCalendarMonth, monthOf, monthOfWeek, type CalendarMonth } from './monthCalendar';

export interface SchoolsQuery {
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  /** Monday to Sunday of the shown week. */
  readonly range: DateRange;
  readonly month: CalendarMonth;
  readonly notice: string | null;
}

function parseWeek(raw: string | undefined, today: CalendarDay): { week: CalendarDay; notice: string | null } {
  if (raw === undefined) return { week: mondayOf(today), notice: null };
  if (!isCalendarDay(raw)) return { week: mondayOf(today), notice: SCHOOLS_LABELS.invalidDayNotice };
  return { week: mondayOf(raw), notice: null };
}

function parseMonth(raw: string | undefined, today: CalendarDay, week: CalendarDay): CalendarMonth {
  const isShowable = raw !== undefined && isCalendarMonth(raw) && raw >= monthOf(today);
  return isShowable ? raw : monthOfWeek(week);
}

/** The shown week (the current one when missing or unreadable) and the shown month (the week's month when missing, invalid or past). */
export function parseSchoolsQuery(params: SearchParamsInput, now: Date): SchoolsQuery {
  const today = currentEventDay(now);
  const { week, notice } = parseWeek(firstValue(params.week), today);
  return {
    week,
    range: scheduleSpan({ from: week, to: week }),
    month: parseMonth(firstValue(params['preview-month']), today, week),
    notice,
  };
}
