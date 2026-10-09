import 'server-only';

import type { OccurrenceSource } from '@events/contract/source';
import type { CalendarDay } from '@events/time';
import { scheduleSpan } from '@/features/events/schedule';
import { buildMonthCalendar, countByDay, daysOf, type CalendarMonth } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

interface SchoolsCalendarProps {
  readonly source: OccurrenceSource;
  readonly month: CalendarMonth;
  readonly selectedDay: CalendarDay;
  readonly today: CalendarDay;
}

/** Reads the school events of the whole month grid (edge weeks included) for the day markers. */
export async function SchoolsCalendar({ source, month, selectedDay, today }: SchoolsCalendarProps) {
  const listings = await source.listOccurrences(scheduleSpan(daysOf(month)));
  return (
    <MonthCalendar
      calendar={buildMonthCalendar({ month, today, selectedDay, counts: countByDay(listings) })}
      selectedDay={selectedDay}
      today={today}
    />
  );
}
