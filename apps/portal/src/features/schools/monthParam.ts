import type { CalendarDay } from '@events/time';
import { isCalendarMonth, monthOf, type CalendarMonth } from './monthCalendar';

/** The month named in the path; an unreadable or past one gives the current month. */
export function monthFromPath(raw: string, today: CalendarDay): CalendarMonth {
  const current = monthOf(today);
  return isCalendarMonth(raw) && raw >= current ? raw : current;
}
