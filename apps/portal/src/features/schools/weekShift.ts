import { addDays, DAYS_IN_WEEK, type CalendarDay } from '@events/time';

/** Monday of the week one week before or after. */
export function shiftWeek(week: CalendarDay, direction: -1 | 1): CalendarDay {
  return addDays(week, direction * DAYS_IN_WEEK);
}
