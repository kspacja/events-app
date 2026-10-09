import { addDays, DAYS_IN_WEEK, mondayOf, type CalendarDay } from '@events/time';

export type CalendarMonth = `${number}-${number}`;

const MONTH_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])$/;
const THURSDAY_OFFSET = 3;
const MAX_DOTS = 3;
const DOT_PER_EVENT_UP_TO = 4;

export function isCalendarMonth(value: string): value is CalendarMonth {
  return MONTH_FORMAT.test(value);
}

export function monthOf(day: CalendarDay): CalendarMonth {
  return day.slice(0, 7) as CalendarMonth;
}

/** The month a week mostly falls in: the one holding its Thursday. */
export function monthOfWeek(monday: CalendarDay): CalendarMonth {
  return monthOf(addDays(monday, THURSDAY_OFFSET));
}

export function addMonths(month: CalendarMonth, amount: number): CalendarMonth {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + amount;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}` as CalendarMonth;
}

export function firstDayOf(month: CalendarMonth): CalendarDay {
  return `${month}-01` as CalendarDay;
}

/** Znacznik dnia: one dot per event up to 4; from 5 on, 3 dots and the rest as a number. */
export interface DayMarker {
  readonly dots: number;
  readonly more: number;
}

export function dayMarker(count: number): DayMarker | null {
  if (count <= 0) return null;
  if (count <= DOT_PER_EVENT_UP_TO) return { dots: count, more: 0 };
  return { dots: MAX_DOTS, more: count - MAX_DOTS };
}

export interface CalendarCell {
  readonly day: CalendarDay;
  readonly count: number;
  readonly marker: DayMarker | null;
  readonly inMonth: boolean;
  readonly isPast: boolean;
  readonly isToday: boolean;
}

export interface CalendarWeek {
  readonly monday: CalendarDay;
  readonly isCurrent: boolean;
  readonly isSelected: boolean;
  readonly days: readonly CalendarCell[];
}

export interface MonthView {
  readonly month: CalendarMonth;
  readonly weeks: readonly CalendarWeek[];
  /** null for the current month: the calendar does not go back in time. */
  readonly previous: CalendarMonth | null;
  readonly next: CalendarMonth;
}

interface MonthCalendarInput {
  readonly month: CalendarMonth;
  /** The current event day (`currentEventDay`): before 04:00 it is still yesterday. */
  readonly today: CalendarDay;
  /** Its week is the selected one. */
  readonly selectedDay: CalendarDay;
  /** Events per day; missing days count as 0. */
  readonly counts: ReadonlyMap<CalendarDay, number>;
}

/** The Mondays of every week that has a day in the month: 4 to 6 rows. */
export function weeksOf(month: CalendarMonth): CalendarDay[] {
  const lastDay = addDays(firstDayOf(addMonths(month, 1)), -1);
  const mondays: CalendarDay[] = [];
  for (let monday = mondayOf(firstDayOf(month)); monday <= lastDay; monday = addDays(monday, DAYS_IN_WEEK)) {
    mondays.push(monday);
  }
  return mondays;
}

export function buildMonthCalendar({ month, today, selectedDay, counts }: MonthCalendarInput): MonthView {
  const currentWeek = mondayOf(today);
  const selectedMonday = mondayOf(selectedDay);
  const weeks = weeksOf(month).map((monday): CalendarWeek => ({
    monday,
    isCurrent: monday === currentWeek,
    isSelected: monday === selectedMonday,
    days: Array.from({ length: DAYS_IN_WEEK }, (_, offset): CalendarCell => {
      const day = addDays(monday, offset);
      const count = counts.get(day) ?? 0;
      return {
        day,
        count,
        marker: dayMarker(count),
        inMonth: monthOf(day) === month,
        isPast: day < today,
        isToday: day === today,
      };
    }),
  }));

  return {
    month,
    weeks,
    previous: month > monthOf(today) ? addMonths(month, -1) : null,
    next: addMonths(month, 1),
  };
}
