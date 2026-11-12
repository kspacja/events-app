import { redirect } from 'next/navigation';
import { currentEventDay } from '@events/time';
import { MapPoints } from '@/features/schools/components/MapDialog';
import { MonthGrid } from '@/features/schools/components/MonthGrid';
import { MonthDock } from '@/features/schools/components/MonthDock';
import { monthOf } from '@/features/schools/monthCalendar';
import { monthFromPath } from '@/features/schools/monthParam';
import { splitPassedWeeks, weekJumpsOf } from '@/features/schools/monthWeeks';
import { loadMonthSchedule } from '@/features/schools/monthSchedule';
import { schoolsMonthHref } from '@/features/schools/schoolsHref';
import { filtersQuery, parseFilters } from '@/features/schools/schoolFilters';
import { dayCountsOf, upcomingCount } from '@/features/schools/weekCount';

export default async function MonthPage({ params, searchParams }: PageProps<'/dla-szkol/miesiac/[month]'>) {
  const { month: raw } = await params;
  const query = filtersQuery(parseFilters(await searchParams));
  const today = currentEventDay(new Date());
  const month = monthFromPath(raw, today);
  if (raw !== month) redirect(schoolsMonthHref(month, query));

  const schedule = await loadMonthSchedule(month, query);
  const { shown, passed } = splitPassedWeeks(schedule.weeks, today);
  const upcoming = month === monthOf(today) ? upcomingCount(dayCountsOf(schedule), today) : null;

  return (
    <>
      <MapPoints points={schedule.mapPoints} focus={schedule.mapFocus} />
      {/* First in the page, so the month heading comes before its days; the dock itself floats at the bottom */}
      <MonthDock month={month} today={today} filtersQuery={query} total={schedule.activeCount} upcoming={upcoming} jumps={weekJumpsOf(shown, today)} />
      <MonthGrid month={month} weeks={shown} passed={passed} today={today} />
    </>
  );
}
