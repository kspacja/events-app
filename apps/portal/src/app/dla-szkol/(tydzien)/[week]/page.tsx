import { redirect } from 'next/navigation';
import { currentEventDay, mondayOf, type CalendarDay } from '@events/time';
import { StripControls } from '@/features/events/components/StripControls';
import { WeekGrid } from '@/features/events/components/WeekGrid';
import { MapPoints } from '@/features/schools/components/MapDialog';
import { WeekCount } from '@/features/schools/components/WeekNavigation';
import { loadWeekSchedule } from '@/features/schools/weekSchedule';
import { schoolsHref } from '@/features/schools/schoolsHref';
import { weekFromPath } from '@/features/schools/weekParam';
import { isPastWeek } from '@/features/schools/weekShift';
import { dayCountsOf } from '@/features/schools/weekCount';
import { filtersQuery, parseFilters } from '@/features/schools/schoolFilters';

export default async function WeekPage({ params, searchParams }: PageProps<'/dla-szkol/[week]'>) {
  const { week: raw } = await params;
  const query = filtersQuery(parseFilters(await searchParams));
  const today = currentEventDay(new Date());
  const { week, valid } = weekFromPath(raw, today);
  if (!valid || raw !== week) redirect(schoolsHref(week, undefined, query));
  // A week that has fully passed has nothing to show: go to the current one
  if (isPastWeek(week, today)) redirect(schoolsHref(mondayOf(today), undefined, query));

  const schedule = await loadWeekSchedule(week as CalendarDay, query);

  return (
    <>
      <MapPoints points={schedule.mapPoints} focus={schedule.mapFocus} />
      <WeekCount
        week={week as CalendarDay}
        filtersQuery={query}
        total={schedule.activeCount}
        days={dayCountsOf(schedule)}
      />
      <StripControls days={schedule.weeks.flat().map(({ day }) => day)} />
      <WeekGrid schedule={schedule} today={today} />
    </>
  );
}
