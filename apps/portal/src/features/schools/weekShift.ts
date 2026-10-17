import { addDays, DAYS_IN_WEEK, type CalendarDay } from '@events/time';

/** Monday of the week one week before or after. */
export function shiftWeek(week: CalendarDay, direction: -1 | 1): CalendarDay {
  return addDays(week, direction * DAYS_IN_WEEK);
}

/** Every day of the week is before today (the current event day), so there is nothing left to visit. */
export function isPastWeek(week: CalendarDay, today: CalendarDay): boolean {
  return addDays(week, DAYS_IN_WEEK - 1) < today;
}

/** Where the strip lands in a week: today when the week has already started, otherwise its Monday. */
export function firstOpenDay(week: CalendarDay, today: CalendarDay): CalendarDay {
  return today > week && !isPastWeek(week, today) ? today : week;
}
