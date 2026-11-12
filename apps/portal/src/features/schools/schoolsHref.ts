import type { CalendarDay } from '@events/time';
import type { CalendarMonth } from './monthCalendar';

export const SCHOOLS_PATH = '/dla-szkol';

/** The schools page for a week (its Monday), with the filters' query and optionally a hash that the week strip reads once. */
export function schoolsHref(week: CalendarDay, anchor?: string, filtersQuery = ''): string {
  return `${SCHOOLS_PATH}/${week}${filtersQuery}${anchor ? `#${anchor}` : ''}`;
}

/** The month view of the schools page, with the filters' query. */
export function schoolsMonthHref(month: CalendarMonth, filtersQuery = ''): string {
  return `${SCHOOLS_PATH}/miesiac/${month}${filtersQuery}`;
}
