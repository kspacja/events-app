import type { CalendarDay } from '@events/time';

export const SCHOOLS_PATH = '/dla-szkol';

/** The schools page for a week (its Monday), optionally with a hash that the week strip reads once. */
export function schoolsHref(week: CalendarDay, anchor?: string): string {
  return `${SCHOOLS_PATH}/${week}${anchor ? `#${anchor}` : ''}`;
}
