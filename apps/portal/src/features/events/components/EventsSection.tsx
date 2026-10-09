import 'server-only';

import type { ReactNode } from 'react';
import type { OccurrenceSource } from '@events/contract/source';
import type { DateRange } from '@events/time';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import { buildSchedule, formatCount, scheduleSpan } from '../schedule';
import { EventsMapLoader } from './EventsMapLoader';
import { Header, type RangeNavigation } from './Header';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { MapToggle } from './MapToggle';
import { STRIP_LABELS } from '../labels';
import { ScrollHint } from './ScrollHint';
import { SkipLink } from './SkipLink';
import { StripControls } from './StripControls';
import styles from './EventsSection.module.css';
import { WeekGrid } from './WeekGrid';

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

export async function EventsSection({
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
  const listings = await source.listOccurrences(scheduleSpan(range));
  const schedule = buildSchedule(listings, { range, time });

  const header = (
    <Header
      sentence={sentence}
      controls={controls}
      notice={notice}
      rangeLabel={formatRangeLabel(range)}
      rangeNavigation={rangeNavigation}
      timeLabel={time ? formatTimeWindow(time) : undefined}
      countLabel={formatCount(schedule.activeCount)}
      layout={layout}
      controlsLabels={controlsLabels}
      map={
        <>
          <SkipLink />
          <MapToggle>
            <EventsMapLoader points={schedule.mapPoints} focus={schedule.mapFocus} />
          </MapToggle>
        </>
      }
    />
  );

  return (
    <OccurrenceSelectionProvider>
      {layout === 'split' ? (
        <div className={styles.split}>
          {header}
          <div className={styles.program}>
            <div className={styles.weekArrows}>
              {rangeNavigation?.previous}
              {rangeNavigation?.next}
            </div>
            <div className={styles.hint}>
              <ScrollHint label={STRIP_LABELS.scrollHint} direction={1} />
              <ScrollHint label={STRIP_LABELS.scrollBackHint} direction={-1} />
            </div>
            <div className={styles.strip}>
              <StripControls days={schedule.weeks.flat().map(({ day }) => day)} />
              <WeekGrid schedule={schedule} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {header}
          <WeekGrid schedule={schedule} />
        </>
      )}
    </OccurrenceSelectionProvider>
  );
}
