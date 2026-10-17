import type { CalendarDay } from '@events/time';

export const SCHOOLS_PATH = '/dla-szkol';

/** The schools page for a week (its Monday), with the filters' query and optionally a hash that the week strip reads once. */
export function schoolsHref(week: CalendarDay, anchor?: string, filtersQuery = ''): string {
  return `${SCHOOLS_PATH}/${week}${filtersQuery}${anchor ? `#${anchor}` : ''}`;
}
