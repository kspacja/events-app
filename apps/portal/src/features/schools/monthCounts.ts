import type { CalendarMonth } from './monthCalendar';

export type MonthCounts = Readonly<Record<string, number>>;

// One request per month, shared by every day of the grid and by later visits within the page
const cache = new Map<CalendarMonth, Promise<MonthCounts>>();

/** Browser only: the markers are missing, not broken, when the counts cannot be loaded. */
export function loadMonthCounts(month: CalendarMonth): Promise<MonthCounts> {
  const cached = cache.get(month);
  if (cached) return cached;
  const url = new URL('/api/school-counts', window.location.origin);
  url.searchParams.set('month', month);
  const loaded = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`school counts ${response.status}`);
      return response.json() as Promise<MonthCounts>;
    })
    .catch(() => {
      cache.delete(month);
      return {};
    });
  cache.set(month, loaded);
  return loaded;
}
