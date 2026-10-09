import 'server-only';

import type { CalendarDay } from '@events/time';
import { buildMonthCalendar, type CalendarMonth } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

interface SchoolsCalendarProps {
  readonly month: CalendarMonth;
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  readonly today: CalendarDay;
}

/** Static: the grid needs no events; the day markers are loaded in the browser (DayMarkers). */
export function SchoolsCalendar({ month, week, today }: SchoolsCalendarProps) {
  return (
    <MonthCalendar
      calendar={buildMonthCalendar({ month, today, selectedWeek: week })}
      shownWeek={week}
      today={today}
    />
  );
}
