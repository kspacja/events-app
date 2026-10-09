import { redirect } from 'next/navigation';
import { currentEventDay, type CalendarDay } from '@events/time';
import { StripControls } from '@/features/events/components/StripControls';
import { WeekGrid } from '@/features/events/components/WeekGrid';
import { WeekMapPoints } from '@/features/schools/components/WeekNavigation';
import { loadWeekSchedule } from '@/features/schools/weekSchedule';
import { schoolsHref } from '@/features/schools/schoolsHref';
import { weekFromPath } from '@/features/schools/weekParam';

export default async function WeekPage({ params }: { readonly params: Promise<{ week: string }> }) {
  const { week: raw } = await params;
  const { week, valid } = weekFromPath(raw, currentEventDay(new Date()));
  if (!valid || raw !== week) redirect(schoolsHref(week));

  const schedule = await loadWeekSchedule(week as CalendarDay);
  return (
    <>
      <WeekMapPoints points={schedule.mapPoints} focus={schedule.mapFocus} />
      <StripControls days={schedule.weeks.flat().map(({ day }) => day)} />
      <WeekGrid schedule={schedule} />
    </>
  );
}
