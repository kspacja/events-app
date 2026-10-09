import 'server-only';

import type { OccurrenceSource } from '@events/contract/source';
import { addDays, DAYS_IN_WEEK, eventDayOf, type CalendarDay } from '@events/time';
import { buildMonthCalendar, weeksOf, type CalendarMonth } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

interface SchoolsCalendarProps {
  readonly source: OccurrenceSource;
  readonly month: CalendarMonth;
  readonly selectedDay: CalendarDay;
  readonly today: CalendarDay;
}

/** Counts the school events on every day of the month grid, for the day markers. */
export async function SchoolsCalendar({ source, month, selectedDay, today }: SchoolsCalendarProps) {
  const mondays = weeksOf(month);
  const listings = await source.listOccurrences({ from: mondays[0], to: addDays(mondays[mondays.length - 1], DAYS_IN_WEEK - 1) });
  const counts = new Map<CalendarDay, number>();
  for (const { startsAt } of listings) {
    const day = eventDayOf(startsAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return (
    <MonthCalendar
      calendar={buildMonthCalendar({ month, today, selectedDay, counts })}
      selectedDay={selectedDay}
      today={today}
    />
  );
}
