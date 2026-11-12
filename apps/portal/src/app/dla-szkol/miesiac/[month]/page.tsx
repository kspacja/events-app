import { redirect } from 'next/navigation';
import { currentEventDay } from '@events/time';
import { MonthGrid } from '@/features/schools/components/MonthGrid';
import { MonthHeader } from '@/features/schools/components/MonthHeader';
import { monthOf } from '@/features/schools/monthCalendar';
import { monthFromPath } from '@/features/schools/monthParam';
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
  const upcoming = month === monthOf(today) ? upcomingCount(dayCountsOf(schedule), today) : null;

  return (
    <>
      <MonthHeader month={month} today={today} filtersQuery={query} total={schedule.activeCount} upcoming={upcoming} />
      <MonthGrid weeks={schedule.weeks} today={today} />
    </>
  );
}
