import type { CalendarDay } from '@events/time';
import { formatCount } from '@/features/events/schedule';

const pluralRules = new Intl.PluralRules('pl');

/** Events still ahead: today's and later days only. */
export function upcomingCount(days: Readonly<Record<string, number>>, today: CalendarDay): number {
  return Object.entries(days).reduce((sum, [day, count]) => (day >= today ? sum + count : sum), 0);
}

/** The week's count; once some of it has passed, what is still ahead comes first, e.g. "3 nadchodzące · 19 w tygodniu". */
export function formatWeekCount(total: number, upcoming: number | null): string {
  if (upcoming === null || upcoming >= total) return formatCount(total);
  const form = upcoming !== 1 && pluralRules.select(upcoming) !== 'few' ? 'nadchodzących' : 'nadchodzące';
  return `${upcoming} ${form} · ${total} w tygodniu`;
}
