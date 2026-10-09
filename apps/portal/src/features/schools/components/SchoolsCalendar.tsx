import 'server-only';

import type { OccurrenceListing } from '@events/contract/listing';
import type { CalendarDay } from '@events/time';
import { buildMonthCalendar, countByDay, type CalendarMonth } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

interface SchoolsCalendarProps {
  /** School events of the whole month grid (edge weeks included), requested by the page. */
  readonly listings: Promise<OccurrenceListing[]>;
  readonly month: CalendarMonth;
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  readonly today: CalendarDay;
}

/** Counts the school events per day for the day markers. */
export async function SchoolsCalendar({ listings, month, week, today }: SchoolsCalendarProps) {
  const counts = countByDay(await listings);
  return (
    <MonthCalendar
      calendar={buildMonthCalendar({ month, today, selectedWeek: week, counts })}
      shownWeek={week}
      today={today}
    />
  );
}
