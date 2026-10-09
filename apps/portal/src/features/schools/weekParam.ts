import { isCalendarDay, mondayOf, type CalendarDay } from '@events/time';

/** The Monday of the week named in the path; an unreadable date gives the current week with `valid: false`. */
export function weekFromPath(raw: string, today: CalendarDay): { readonly week: CalendarDay; readonly valid: boolean } {
  if (!isCalendarDay(raw)) return { week: mondayOf(today), valid: false };
  return { week: mondayOf(raw), valid: true };
}
