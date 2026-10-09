import type { CalendarDay } from '@events/time';
import type { CalendarMonth } from './monthCalendar';

export const SCHOOLS_PATH = '/dla-szkol';

interface SchoolsState {
  readonly day: CalendarDay;
  readonly month: CalendarMonth;
}

/** The schools page for a picked day (its week is shown) and a shown month, optionally scrolled to an element. */
export function schoolsHref({ day, month }: SchoolsState, anchor?: string): string {
  const query = new URLSearchParams({ day, month });
  return `${SCHOOLS_PATH}?${query}${anchor ? `#${anchor}` : ''}`;
}
