import { addDays, type CalendarDay } from '@events/time';
import { monthOf, type CalendarMonth } from './monthCalendar';

export type MonthCounts = Readonly<Record<string, number>>;

// One request per month and filters, shared by every day of the grid and by later visits within the page
const cache = new Map<string, Promise<MonthCounts>>();
// The same counts once they arrive, for synchronous reads
const resolved = new Map<string, MonthCounts>();

/** Browser only: the markers are missing, not broken, when the counts cannot be loaded. */
export function loadMonthCounts(month: CalendarMonth, filtersQuery = ''): Promise<MonthCounts> {
  const key = `${month}${filtersQuery}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = new URL(`/api/school-counts${filtersQuery}`, window.location.origin);
  url.searchParams.set('month', month);
  const loaded = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`school counts ${response.status}`);
      return response.json() as Promise<MonthCounts>;
    })
    .then((counts) => {
      resolved.set(key, counts);
      return counts;
    })
    .catch(() => {
      cache.delete(key);
      return {};
    });
  cache.set(key, loaded);
  return loaded;
}

const WEEK_DAYS = 7;

/** The week's event count from month counts already loaded, or null while a month is missing; never fetches. */
export function cachedWeekTotal(week: CalendarDay, filtersQuery = ''): number | null {
  let total = 0;
  for (let offset = 0; offset < WEEK_DAYS; offset++) {
    const day = addDays(week, offset);
    const counts = resolved.get(`${monthOf(day)}${filtersQuery}`);
    if (!counts) return null;
    total += counts[day] ?? 0;
  }
  return total;
}
