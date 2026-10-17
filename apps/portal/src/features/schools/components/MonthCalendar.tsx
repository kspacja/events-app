'use client';

import { useId, useState } from 'react';
import { mondayOf, type CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import { DAY_NAMES } from '@/features/events/labels';
import { DayJump } from '@/features/events/components/DayJump';
import { dayDomId } from '@/features/events/scheduleDom';
import { CALENDAR_LABELS, WEEKDAY_SHORT_NAMES } from '../labels';
import {
  buildMonthCalendar,
  firstDayOf,
  monthOf,
  monthOfWeek,
  type CalendarCell,
  type CalendarMonth,
  type CalendarWeek,
} from '../monthCalendar';
import { schoolsHref } from '../schoolsHref';
import { useFiltersQuery } from '../filtersQueryContext';
import { DayMarkers } from './DayMarkers';
import styles from './MonthCalendar.module.css';

interface MonthCalendarProps {
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  readonly today: CalendarDay;
  /** Takes over a day link to another week (its Monday and the day's anchor). */
  readonly onNavigate?: (week: CalendarDay, anchor: string) => void;
}

function weekState(week: CalendarWeek): string[] {
  return [
    ...(week.isCurrent ? [CALENDAR_LABELS.currentWeek] : []),
    ...(week.isSelected ? [CALENDAR_LABELS.selectedWeek] : []),
  ];
}

function DayCell({
  cell,
  week,
  shownWeek,
  month,
  count,
  onNavigate,
}: {
  readonly cell: CalendarCell;
  readonly week: CalendarWeek;
  readonly shownWeek: CalendarDay;
  readonly month: CalendarMonth;
  readonly count?: number;
  readonly onNavigate?: (week: CalendarDay, anchor: string) => void;
}) {
  const filtersQuery = useFiltersQuery();
  const number = formatDay(cell.day, 'd');
  const date = formatDay(cell.day, 'EEEE, d MMMM');
  const className = [styles.day, cell.inMonth ? '' : styles.outside, cell.isToday ? styles.today : '']
    .filter(Boolean)
    .join(' ');

  if (cell.isPast) {
    return (
      <span className={`${className} ${styles.past}`}>
        <span aria-hidden="true">{number}</span>
        <span className="visually-hidden">{`${date}, ${CALENDAR_LABELS.pastDay}`}</span>
      </span>
    );
  }
  const state = weekState(week);
  return (
    <DayJump
      day={cell.day}
      shownWeek={shownWeek}
      href={schoolsHref(mondayOf(cell.day), dayDomId(cell.day), filtersQuery)}
      onNavigate={onNavigate ? () => onNavigate(mondayOf(cell.day), dayDomId(cell.day)) : undefined}
      className={className}
      aria-current={cell.isToday ? 'date' : undefined}
    >
      <span className="visually-hidden">{date}</span>
      <span aria-hidden="true">{number}</span>
      <DayMarkers day={cell.day} month={month} count={count} />
      {state.length > 0 ? <span className="visually-hidden">{`, ${state.join(', ')}`}</span> : null}
    </DayJump>
  );
}

/** Kalendarz miesiąca: a day scrolls to it within the shown week or moves to its week; the arrows change only the shown month, never the URL. */
export function MonthCalendar({ week, today, onNavigate }: MonthCalendarProps) {
  const [shown, setShown] = useState({ week, month: monthOfWeek(week) });
  // A new week brings its own month; in between, the arrows move the month on their own
  const month = shown.week === week ? shown.month : monthOfWeek(week);
  if (shown.week !== week) setShown({ week, month });

  const calendar = buildMonthCalendar({ month, today, selectedWeek: week });
  const { weeks, previous, next } = calendar;
  const move = (target: CalendarMonth) => setShown({ week, month: target });
  // The page renders the calendar twice (desktop sidebar, phone panel), so the title id must be unique
  const titleId = useId();

  return (
    <nav className={styles.calendar} aria-label={CALENDAR_LABELS.region}>
      <div className={styles.toolbar}>
        <h2 id={titleId} className={styles.title}>
          {formatDay(firstDayOf(month), 'LLLL yyyy')}
        </h2>
        <div className={styles.navigation}>
          {previous ? (
            <button
              type="button"
              className={styles.arrow}
              aria-label={CALENDAR_LABELS.previousMonth}
              onClick={() => move(previous)}
            >
              ‹
            </button>
          ) : (
            <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
              ‹
            </span>
          )}
          <button
            type="button"
            className={styles.arrow}
            aria-label={CALENDAR_LABELS.nextMonth}
            onClick={() => move(next)}
          >
            ›
          </button>
        </div>
      </div>
      <table className={styles.grid} aria-labelledby={titleId}>
        <thead>
          <tr>
            {WEEKDAY_SHORT_NAMES.map((name, index) => (
              <th key={name} scope="col" className={styles.weekday}>
                <span aria-hidden="true">{name}</span>
                <span className="visually-hidden">{DAY_NAMES[index]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((calendarWeek) => (
            <tr
              key={calendarWeek.monday}
              className={styles.week}
              data-current={calendarWeek.isCurrent || undefined}
              data-selected={calendarWeek.isSelected || undefined}
            >
              {calendarWeek.days.map((cell) => (
                <td key={cell.day} className={styles.cell}>
                  <DayCell cell={cell} week={calendarWeek} shownWeek={week} month={calendar.month} onNavigate={onNavigate} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </nav>
  );
}

const WEEK_DAYS = 7;

interface WeekRowProps extends MonthCalendarProps {
  /** Event counts per day of this week, when the week's page already has them. */
  readonly dayCounts?: Readonly<Record<string, number>>;
}

/** Phones: only the shown week's row of the calendar, each day with its own month's markers. */
export function WeekRow({ week, today, onNavigate, dayCounts }: WeekRowProps) {
  const calendar = buildMonthCalendar({ month: monthOfWeek(week), today, selectedWeek: week });
  const calendarWeek = calendar.weeks.find((candidate) => candidate.isSelected);
  if (!calendarWeek || calendarWeek.days.length !== WEEK_DAYS) return null;

  return (
    <table className={`${styles.grid} ${styles.weekRow}`} aria-label={formatDay(week, "'Tydzień od' d MMMM")}>
      <thead>
        <tr>
          {WEEKDAY_SHORT_NAMES.map((name, index) => (
            <th key={name} scope="col" className={styles.weekday}>
              <span aria-hidden="true">{name}</span>
              <span className="visually-hidden">{DAY_NAMES[index]}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className={styles.week} data-current={calendarWeek.isCurrent || undefined}>
          {calendarWeek.days.map((cell) => (
            <td key={cell.day} className={styles.cell}>
              {/* A week across two months: every day counts as in its own month */}
              <DayCell
                cell={{ ...cell, inMonth: true }}
                week={calendarWeek}
                shownWeek={week}
                month={monthOf(cell.day)}
                count={dayCounts?.[cell.day]}
                onNavigate={onNavigate}
              />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
