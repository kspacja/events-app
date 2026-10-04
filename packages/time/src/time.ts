import { TZDate } from '@date-fns/tz';
import {
  addDays as addDaysToDate,
  differenceInCalendarDays,
  format,
  getISODay,
  startOfISOWeek,
} from 'date-fns';

export const APP_TIME_ZONE = 'Europe/Warsaw';
/** The event day ends at 04:00 local time, so late-night events belong to the evening before. */
export const DAY_BOUNDARY_MINUTES = 240;
export const DAYS_IN_WEEK = 7;
export const MINUTES_PER_HOUR = 60;

/** Calendar day as `YYYY-MM-DD`, independent of any timezone. */
export type CalendarDay = `${number}-${number}-${number}`;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_FORMAT = 'yyyy-MM-dd';
const UTC = 'UTC';

function toCalendarDay(date: Date): CalendarDay {
  return format(date, DAY_FORMAT) as CalendarDay;
}

/** UTC-anchored, so calendar math never depends on the machine's timezone. */
export function calendarDayToDate(day: CalendarDay): TZDate {
  const [year, month, date] = day.split('-').map(Number);
  return new TZDate(year, month - 1, date, UTC);
}

export function isCalendarDay(value: string): value is CalendarDay {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, date] = match.slice(1).map(Number);
  const utc = new Date(Date.UTC(year, month - 1, date));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === date
  );
}

export function addDays(day: CalendarDay, amount: number): CalendarDay {
  return toCalendarDay(addDaysToDate(calendarDayToDate(day), amount));
}

export function diffInDays(from: CalendarDay, to: CalendarDay): number {
  return differenceInCalendarDays(calendarDayToDate(to), calendarDayToDate(from));
}

/** Days since Monday: Monday = 0 ... Sunday = 6. */
export function weekdayIndex(day: CalendarDay): number {
  return getISODay(calendarDayToDate(day)) - 1;
}

export function mondayOf(day: CalendarDay): CalendarDay {
  return toCalendarDay(startOfISOWeek(calendarDayToDate(day)));
}

function inWarsaw(instant: Date | string): TZDate {
  return new TZDate(new Date(instant), APP_TIME_ZONE);
}

/** The local (Europe/Warsaw) calendar day containing the instant. */
export function localDayOf(instant: Date | string): CalendarDay {
  return toCalendarDay(inWarsaw(instant));
}

/** Minutes after local (Europe/Warsaw) midnight. */
export function localMinutesOf(iso: string): number {
  const local = inWarsaw(iso);
  return local.getHours() * MINUTES_PER_HOUR + local.getMinutes();
}

/** Uses wall-clock time, so the boundary stays at 04:00 on DST change days. */
export function eventDayOf(iso: string): CalendarDay {
  const calendarDay = localDayOf(iso);
  return localMinutesOf(iso) < DAY_BOUNDARY_MINUTES
    ? addDays(calendarDay, -1)
    : calendarDay;
}

/** The event day "now" falls in; before 04:00 it is still the previous day. */
export function currentEventDay(now: Date): CalendarDay {
  return eventDayOf(now.toISOString());
}

/** ISO string for a local wall-clock time, with the UTC offset valid on that day. */
export function toInstantIso(day: CalendarDay, minutes: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const local = new TZDate(
    year,
    month - 1,
    date,
    Math.floor(minutes / MINUTES_PER_HOUR),
    minutes % MINUTES_PER_HOUR,
    APP_TIME_ZONE,
  );
  return format(local, "yyyy-MM-dd'T'HH:mm:ssxxx");
}
