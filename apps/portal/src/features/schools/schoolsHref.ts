import type { CalendarDay } from '@events/time';
import type { CalendarMonth } from './monthCalendar';

export const SCHOOLS_PATH = '/dla-szkol';

interface SchoolsState {
  readonly week: CalendarDay;
  readonly month: CalendarMonth;
}

/** The schools page for a week and a shown month, optionally scrolled to an element. */
export function schoolsHref({ week, month }: SchoolsState, anchor?: string): string {
  const query = new URLSearchParams({ week, month });
  return `${SCHOOLS_PATH}?${query}${anchor ? `#${anchor}` : ''}`;
}
