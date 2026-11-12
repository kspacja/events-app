import type { CalendarDay, DateRange } from '@events/time';
import { formatCount, type ScheduleDay } from '@/features/events/schedule';
import { formatRangeLabel } from '@/features/search/dateRange';
import { isPastWeek } from './weekShift';

type Week = readonly ScheduleDay[];

export interface PassedWeeks {
  /** The month's days in the hidden weeks. */
  readonly range: DateRange;
  readonly count: number;
}

export interface MonthWeeks {
  readonly shown: readonly Week[];
  /** null when no hidden week had an event: nothing worth a note. */
  readonly passed: PassedWeeks | null;
}

/** Weeks whose every day is gone leave the grid; their events only add up to a note. */
export function splitPassedWeeks(weeks: readonly Week[], today: CalendarDay): MonthWeeks {
  const gone = weeks.filter((week) => isPastWeek(week[0].day, today));
  const shown = weeks.filter((week) => !isPastWeek(week[0].day, today));
  const days = gone.flat().filter(({ inRange }) => inRange);
  const count = days.reduce((sum, { entries }) => sum + entries.filter(({ active }) => active).length, 0);
  if (count === 0) return { shown, passed: null };
  return { shown, passed: { range: { from: days[0].day, to: days[days.length - 1].day }, count } };
}

const pluralRules = new Intl.PluralRules('pl');

/** e.g. "2–8.11 · 12 wydarzeń minęło", "1.11 · 2 wydarzenia minęły". */
export function formatPassedWeeks({ range, count }: PassedWeeks): string {
  const verb = count !== 1 && pluralRules.select(count) === 'few' ? 'minęły' : 'minęło';
  return `${formatRangeLabel(range)} · ${formatCount(count)} ${verb}`;
}

export interface WeekJump {
  /** The week's days in the month, e.g. "2–8.11". */
  readonly label: string;
  /** Its first day with events; null when it has none, so there is nothing to jump to. */
  readonly target: CalendarDay | null;
}

export function weekJumpsOf(weeks: readonly Week[]): WeekJump[] {
  return weeks.flatMap((week) => {
    const inMonth = week.filter(({ inRange }) => inRange);
    if (inMonth.length === 0) return [];
    const first = inMonth.find(({ entries }) => entries.some(({ active }) => active));
    return [{ label: formatRangeLabel({ from: inMonth[0].day, to: inMonth[inMonth.length - 1].day }), target: first?.day ?? null }];
  });
}
