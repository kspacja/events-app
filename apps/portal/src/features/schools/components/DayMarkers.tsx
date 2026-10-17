'use client';

import { useEffect, useState } from 'react';
import type { CalendarDay } from '@events/time';
import { formatCount } from '@/features/events/schedule';
import { CALENDAR_LABELS } from '../labels';
import { dayMarker, type CalendarMonth } from '../monthCalendar';
import { loadMonthCounts, type MonthCounts } from '../monthCounts';
import { useFiltersQuery } from '../filtersQueryContext';
import styles from './DayMarkers.module.css';

interface DayMarkersProps {
  readonly day: CalendarDay;
  readonly month: CalendarMonth;
  /** Already known (from the shown week's page), so the dots need not wait for the month's counts. */
  readonly count?: number;
}

function useMonthCounts(month: CalendarMonth): MonthCounts | null {
  const filtersQuery = useFiltersQuery();
  const [counts, setCounts] = useState<MonthCounts | null>(null);
  useEffect(() => {
    let active = true;
    void loadMonthCounts(month, filtersQuery).then((loaded) => {
      if (active) setCounts(loaded);
    });
    return () => {
      active = false;
    };
  }, [month, filtersQuery]);
  return counts;
}

/** The day's dots and event count: the known count at once, otherwise loaded in the browser and empty until it arrives. */
export function DayMarkers({ day, month, count }: DayMarkersProps) {
  return count === undefined ? <LoadedMarkers day={day} month={month} /> : <Markers count={count} />;
}

function LoadedMarkers({ day, month }: { readonly day: CalendarDay; readonly month: CalendarMonth }) {
  const counts = useMonthCounts(month);
  return counts ? <Markers count={counts[day] ?? 0} /> : null;
}

function Markers({ count }: { readonly count: number }) {
  const marker = dayMarker(count);
  return (
    <>
      {marker ? (
        <span className={styles.marker} aria-hidden="true">
          {Array.from({ length: marker.dots }, (_, index) => (
            <span key={index} className={styles.dot} />
          ))}
          {marker.more > 0 ? <span className={styles.more}>+{marker.more}</span> : null}
        </span>
      ) : null}
      <span className="visually-hidden">{`, ${count === 0 ? CALENDAR_LABELS.noEvents : formatCount(count)}`}</span>
    </>
  );
}
