import type { CalendarDay } from '@events/time';
import { EventsMapLoader } from '@/features/events/components/EventsMapLoader';
import { MapToggle } from '@/features/events/components/MapToggle';
import { SkipLink } from '@/features/events/components/SkipLink';
import { loadWeekSchedule } from '@/features/schools/weekSchedule';

export default async function WeekMapPage({ params }: { readonly params: Promise<{ week: string }> }) {
  const { week } = await params;
  const { mapPoints, mapFocus } = await loadWeekSchedule(week as CalendarDay);
  return (
    <>
      <SkipLink />
      <MapToggle>
        <EventsMapLoader points={mapPoints} focus={mapFocus} />
      </MapToggle>
    </>
  );
}
