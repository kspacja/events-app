import { addDays, DAYS_IN_WEEK, type CalendarDay } from '@events/time';
import { monthOfWeek, type CalendarMonth } from './monthCalendar';

export interface WeekShift {
  /** Monday of the shifted week. */
  readonly week: CalendarDay;
  readonly month: CalendarMonth;
}

export function shiftWeek(week: CalendarDay, direction: -1 | 1): WeekShift {
  const shifted = addDays(week, direction * DAYS_IN_WEEK);
  return { week: shifted, month: monthOfWeek(shifted) };
}
