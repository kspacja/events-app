import { redirect } from 'next/navigation';
import { currentEventDay, type CalendarDay } from '@events/time';
import { StripControls } from '@/features/events/components/StripControls';
import { WeekGrid } from '@/features/events/components/WeekGrid';
import { WeekCount, WeekMapPoints } from '@/features/schools/components/WeekNavigation';
import { loadWeekSchedule } from '@/features/schools/weekSchedule';
import type { Schedule } from '@/features/events/schedule';
import { schoolsHref } from '@/features/schools/schoolsHref';
import { weekFromPath } from '@/features/schools/weekParam';
import { filtersQuery, parseFilters } from '@/features/schools/schoolFilters';

/** Active events per day, the same numbers the day markers show. */
function dayCountsOf(schedule: Schedule): Record<string, number> {
  return Object.fromEntries(
    schedule.weeks.flat().map(({ day, entries }) => [day, entries.filter(({ active }) => active).length]),
  );
}

export default async function WeekPage({ params, searchParams }: PageProps<'/dla-szkol/[week]'>) {
  const { week: raw } = await params;
  const query = filtersQuery(parseFilters(await searchParams));
  const { week, valid } = weekFromPath(raw, currentEventDay(new Date()));
  if (!valid || raw !== week) redirect(schoolsHref(week, undefined, query));

  const schedule = await loadWeekSchedule(week as CalendarDay, query);
  
  return (
    <>
      <WeekMapPoints points={schedule.mapPoints} focus={schedule.mapFocus} />
      <WeekCount week={week as CalendarDay} count={schedule.activeCount} dayCounts={dayCountsOf(schedule)} />
      <StripControls days={schedule.weeks.flat().map(({ day }) => day)} />
      <WeekGrid schedule={schedule} />
    </>
  );
}
