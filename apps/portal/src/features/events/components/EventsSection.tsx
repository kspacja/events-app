import 'server-only';

import { Suspense, type ReactNode } from 'react';
import type { OccurrenceSource } from '@events/contract/source';
import type { DateRange } from '@events/time';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import { buildSchedule, scheduleSpan } from '../schedule';
import { Header, type RangeNavigation } from './Header';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { MapSkeleton, StripSkeleton } from './WeekSkeleton';
import styles from './EventsSection.module.css';
import { ScrollHint } from './ScrollHint';
import { STRIP_LABELS } from '../labels';
import { WeekCount, WeekMap, WeekStrip } from './WeekProgram';
import { WeekPendingGate, WeekPendingScope } from './WeekPending';
import { formatDay } from '@/lib/format';

interface EventsSectionProps {
  readonly source: OccurrenceSource;
  readonly range: DateRange;
  readonly time: TimeWindow | null;
  readonly sentence: ReactNode;
  readonly controls?: ReactNode;
  readonly notice?: ReactNode;
  readonly rangeNavigation?: RangeNavigation;
  readonly layout?: 'stacked' | 'split';
  readonly controlsLabels?: { readonly show: string; readonly hide: string };
}

export function EventsSection({
  source,
  range,
  time,
  sentence,
  controls,
  notice,
  rangeNavigation,
  layout = 'stacked',
  controlsLabels,
}: EventsSectionProps) {
  const schedule = source
    .listOccurrences(scheduleSpan(range))
    .then((listings) => buildSchedule(listings, { range, time }));

  const header = (
    <Header
      sentence={sentence}
      controls={controls}
      notice={notice}
      rangeLabel={formatRangeLabel(range)}
      rangeNavigation={rangeNavigation}
      timeLabel={time ? formatTimeWindow(time) : undefined}
      countLabel={
        <Suspense fallback={null}>
          <WeekCount schedule={schedule} />
        </Suspense>
      }
      layout={layout}
      controlsLabels={controlsLabels}
      map={
        <WeekPendingGate fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <WeekMap schedule={schedule} />
          </Suspense>
        </WeekPendingGate>
      }
    />
  );

  const strip = (
    <Suspense key={range.from} fallback={<StripSkeleton />}>
      <WeekStrip schedule={schedule} withControls={layout === 'split'} />
    </Suspense>
  );

  return (
    <OccurrenceSelectionProvider>
      {layout === 'split' ? (
        <WeekPendingScope>
          <div className={styles.split}>
            {header}
            <div className={styles.program}>
              <div className={styles.weekArrows}>
                {rangeNavigation?.previous}

                <span className={styles.currentMonth}>
                  {formatDay(range.from, 'LLLL yyyy')}
                  <span className={styles.rangeLabel}>{formatRangeLabel(range)}</span>
                </span>

                {rangeNavigation?.next}
              </div>
              <div className={styles.hint}>
                <ScrollHint label={STRIP_LABELS.scrollHint} direction={1} />
                <ScrollHint label={STRIP_LABELS.scrollBackHint} direction={-1} />
              </div>
              <div className={styles.strip}>
                <WeekPendingGate fallback={<StripSkeleton />}>{strip}</WeekPendingGate>
              </div>
            </div>
          </div>
        </WeekPendingScope>
      ) : (
        <>
          {header}
          {strip}
        </>
      )}
    </OccurrenceSelectionProvider>
  );
}
