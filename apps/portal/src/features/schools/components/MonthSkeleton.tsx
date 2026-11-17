'use client';

import type { CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { addDays, currentEventDay, DAYS_IN_WEEK, type CalendarDay } from '@events/time';
import { STATE_LABELS, UI_LABELS } from '@/features/events/labels';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { CALENDAR_LABELS } from '../labels';
import { monthOf, weeksOf } from '../monthCalendar';
import { monthFromPath } from '../monthParam';
import type { WeekJump } from '../monthWeeks';
import { isPastWeek } from '../weekShift';
import { useFiltersQuery } from '../filtersQueryContext';
import { MonthCaption, MonthWeekdays, monthGridStyle } from './MonthGrid';
import { MonthDock } from './MonthDock';
import grid from './MonthGrid.module.css';
import styles from './MonthSkeleton.module.css';

// Phones list only days with events, so a few cards stand in for them
const PHONE_DAYS = 6;
// Placeholder bars per weekday and per half-height weekend day, varied by the day's number
const WEEKDAY_BARS = [3, 1, 2, 4, 2, 3, 1];
const WEEKEND_BARS = [1, 1, 2];

function barsFor(day: CalendarDay, weekend: boolean): number {
  const pattern = weekend ? WEEKEND_BARS : WEEKDAY_BARS;
  return pattern[Number(day.slice(8)) % pattern.length];
}

/** The month's grid and dock without their events, laid out like the loaded page so nothing moves when it arrives. */
export function MonthSkeleton() {
  const { month: raw } = useParams<{ month: string }>();
  const today = currentEventDay(new Date());
  const month = monthFromPath(typeof raw === 'string' ? raw : '', today);
  const filtersQuery = useFiltersQuery();
  const mondays = weeksOf(month).filter((monday) => !isPastWeek(monday, today));
  const days = mondays.flatMap((monday) => Array.from({ length: DAYS_IN_WEEK }, (_, offset) => addDays(monday, offset)));
  const phoneDays = new Set(days.filter((day) => day >= today && monthOf(day) === month).slice(0, PHONE_DAYS));
  const jumps: WeekJump[] = mondays.map((monday) => {
    const inMonth = Array.from({ length: DAYS_IN_WEEK }, (_, offset) => addDays(monday, offset)).filter(
      (day) => monthOf(day) === month,
    );
    return { label: formatRangeLabel({ from: inMonth[0], to: inMonth[inMonth.length - 1] }), target: null };
  });

  return (
    <div aria-busy="true">
      <p role="status" className="visually-hidden">
        {STATE_LABELS.loading}
      </p>
      <MonthDock month={month} today={today} filtersQuery={filtersQuery} total={null} jumps={jumps} />
      <section aria-label={CALENDAR_LABELS.region} style={monthGridStyle(mondays.length)}>
        <MonthCaption month={month} today={today} />
        <div className={grid.grid} aria-hidden="true">
          <MonthWeekdays />
          <ol className={grid.days}>
            {days.map((day, index) => {
              const weekdayIndex = index % DAYS_IN_WEEK;
              const weekend = weekdayIndex >= 5;
              const inMonth = monthOf(day) === month;
              const bars = inMonth ? barsFor(day, weekend) : 0;
              return (
                <li
                  key={day}
                  className={`${grid.day} ${styles.day}`}
                  data-in-month={inMonth}
                  data-weekend={weekend}
                  data-weekday={weekdayIndex}
                  data-narrow={weekend || undefined}
                  data-past={day < today || undefined}
                  data-phone={phoneDays.has(day) || undefined}
                  style={{ '--row': Math.floor(index / DAYS_IN_WEEK) } as CSSProperties}
                >
                  <div className={grid.dayHeading}>
                    <span className={grid.weekday}>{formatDay(day, 'EEEE')}</span>
                    <span>{formatDay(day, 'd')}</span>
                    {day === today ? <span className={grid.today}>{UI_LABELS.today}</span> : null}
                  </div>
                  <ul className={`${grid.bars} ${styles.bars}`}>
                    {Array.from({ length: bars }, (_, bar) => (
                      <li key={bar} className={styles.bar} />
                    ))}
                  </ul>
                  <div className={grid.footer} />
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
