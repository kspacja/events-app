import { calendarDayToDate, localMinutesOf, MINUTES_PER_HOUR, type CalendarDay } from '@events/time';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

/** Formats a calendar day with a date-fns pattern in Polish. */
export function formatDay(day: CalendarDay, pattern: string): string {
  return format(calendarDayToDate(day), pattern, { locale: pl });
}

/** e.g. `sobota, 3.10` */
export function formatCalendarDay(day: CalendarDay): string {
  return formatDay(day, 'EEEE, d.MM');
}

/** Minutes after midnight as `HH:mm`. */
export function formatClock(minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(minutes / MINUTES_PER_HOUR))}:${pad(minutes % MINUTES_PER_HOUR)}`;
}

/** e.g. `19:00`, in the app time zone. */
export function formatLocalTime(iso: string): string {
  return formatClock(localMinutesOf(iso));
}
