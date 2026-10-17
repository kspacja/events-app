import { redirect } from 'next/navigation';
import { currentEventDay, type CalendarDay } from '@events/time';
import { StripControls } from '@/features/events/components/StripControls';
import { WeekGrid } from '@/features/events/components/WeekGrid';
import { WeekCount, WeekMapPoints } from '@/features/schools/components/WeekNavigation';
import { loadWeekSchedule } from '@/features/schools/weekSchedule';
import { schoolsHref } from '@/features/schools/schoolsHref';
import { weekFromPath } from '@/features/schools/weekParam';
import { filtersQuery, parseFilters } from '@/features/schools/schoolFilters';

export default async function WeekPage({ params, searchParams }: PageProps<'/dla-szkol/[week]'>) {
  const { week: raw } = await params;
  const query = filtersQuery(parseFilters(await searchParams));
  const { week, valid } = weekFromPath(raw, currentEventDay(new Date()));
  if (!valid || raw !== week) redirect(schoolsHref(week, undefined, query));

  const schedule = await loadWeekSchedule(week as CalendarDay, query);
  
  return (
    <>
      <WeekMapPoints points={schedule.mapPoints} focus={schedule.mapFocus} />
      <WeekCount count={schedule.activeCount} />
      <StripControls days={schedule.weeks.flat().map(({ day }) => day)} />
      <WeekGrid schedule={schedule} />
    </>
  );
}
