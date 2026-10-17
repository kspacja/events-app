import 'server-only';

import { Suspense, type ReactNode } from 'react';
import type { OccurrenceSource } from '@events/contract/source';
import type { DateRange } from '@events/time';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import { buildSchedule, scheduleSpan } from '../schedule';
import { Header } from './Header';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { MapSkeleton, StripSkeleton } from './WeekSkeleton';
import { WeekCount, WeekMap, WeekStrip } from './WeekProgram';

interface EventsSectionProps {
  readonly source: OccurrenceSource;
  readonly range: DateRange;
  readonly time: TimeWindow | null;
  readonly sentence: ReactNode;
  readonly notice?: ReactNode;
}

/** The one-column programme (home page): the summary and map on top, the week below. */
export function EventsSection({ source, range, time, sentence, notice }: EventsSectionProps) {
  const schedule = source
    .listOccurrences(scheduleSpan(range))
    .then((listings) => buildSchedule(listings, { range, time }));

  return (
    <OccurrenceSelectionProvider>
      <Header
        sentence={sentence}
        notice={notice}
        rangeLabel={formatRangeLabel(range)}
        timeLabel={time ? formatTimeWindow(time) : undefined}
        countLabel={
          <Suspense fallback={null}>
            <WeekCount schedule={schedule} />
          </Suspense>
        }
        map={
          <Suspense fallback={<MapSkeleton />}>
            <WeekMap schedule={schedule} />
          </Suspense>
        }
      />
      <Suspense fallback={<StripSkeleton />}>
        <WeekStrip schedule={schedule} />
      </Suspense>
    </OccurrenceSelectionProvider>
  );
}
