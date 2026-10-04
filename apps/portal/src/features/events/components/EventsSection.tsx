import type { ReactNode } from 'react';
import type { DateRange } from '@events/time';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import { getOccurrenceSource } from '../source/getOccurrenceSource';
import { buildSchedule, formatCount, scheduleSpan } from '../schedule';
import { EventsMapLoader } from './EventsMapLoader';
import { Header } from './Header';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { MapToggle } from './MapToggle';
import { SkipLink } from './SkipLink';
import { WeekGrid } from './WeekGrid';

interface EventsSectionProps {
  readonly range: DateRange;
  readonly time: TimeWindow | null;
  readonly sentence: ReactNode;
  readonly notice?: ReactNode;
}

export async function EventsSection({ range, time, sentence, notice }: EventsSectionProps) {
  const listings = await getOccurrenceSource().listOccurrences(scheduleSpan(range));
  const schedule = buildSchedule(listings, { range, time });

  return (
    <OccurrenceSelectionProvider>
      <Header
        sentence={sentence}
        notice={notice}
        rangeLabel={formatRangeLabel(range)}
        timeLabel={time ? formatTimeWindow(time) : undefined}
        countLabel={formatCount(schedule.activeCount)}
        map={
          <>
            <SkipLink />
            <MapToggle>
              <EventsMapLoader points={schedule.mapPoints} focus={schedule.mapFocus} />
            </MapToggle>
          </>
        }
      />
      <WeekGrid schedule={schedule} />
    </OccurrenceSelectionProvider>
  );
}
