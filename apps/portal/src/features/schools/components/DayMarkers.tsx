'use client';

import { useEffect, useState } from 'react';
import type { CalendarDay } from '@events/time';
import { formatCount } from '@/features/events/schedule';
import { CALENDAR_LABELS } from '../labels';
import { dayMarker, type CalendarMonth } from '../monthCalendar';
import { loadMonthCounts, type MonthCounts } from '../monthCounts';
import styles from './DayMarkers.module.css';

interface DayMarkersProps {
  readonly day: CalendarDay;
  readonly month: CalendarMonth;
}

function useMonthCounts(month: CalendarMonth): MonthCounts | null {
  const [counts, setCounts] = useState<MonthCounts | null>(null);
  useEffect(() => {
    let active = true;
    void loadMonthCounts(month).then((loaded) => {
      if (active) setCounts(loaded);
    });
    return () => {
      active = false;
    };
  }, [month]);
  return counts;
}

/** The day's dots and event count, loaded in the browser; empty until they arrive. */
export function DayMarkers({ day, month }: DayMarkersProps) {
  const counts = useMonthCounts(month);
  if (!counts) return null;
  const count = counts[day] ?? 0;
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
