import type { CalendarDay } from '@events/time';
import type { CalendarMonth } from './monthCalendar';

export const SCHOOLS_PATH = '/dla-szkol';

interface SchoolsState {
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  readonly month: CalendarMonth;
}

/** The schools page for a shown week and month, optionally with a hash that the week strip reads once. */
export function schoolsHref({ week, month }: SchoolsState, anchor?: string): string {
  const query = new URLSearchParams({ week, 'preview-month': month });
  return `${SCHOOLS_PATH}?${query}${anchor ? `#${anchor}` : ''}`;
}
