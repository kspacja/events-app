import Link from 'next/link';
import type { CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import { formatCount } from '@/features/events/schedule';
import { dayDomId } from '@/features/events/scheduleDom';
import { CALENDAR_LABELS, WEEKDAY_SHORT_NAMES } from '../labels';
import { firstDayOf, monthOf, type CalendarCell, type MonthView } from '../monthCalendar';
import { schoolsHref } from '../schoolsHref';
import styles from './MonthCalendar.module.css';

interface MonthCalendarProps {
  readonly calendar: MonthView;
  readonly selectedDay: CalendarDay;
  readonly today: CalendarDay;
}

function DayMarkerDots({ cell }: { readonly cell: CalendarCell }) {
  if (!cell.marker) return null;
  return (
    <span className={styles.marker} aria-hidden="true">
      {Array.from({ length: cell.marker.dots }, (_, index) => (
        <span key={index} className={styles.dot} />
      ))}
      {cell.marker.more > 0 ? <span className={styles.more}>+{cell.marker.more}</span> : null}
    </span>
  );
}

function DayCell({ cell }: { readonly cell: CalendarCell }) {
  const number = formatDay(cell.day, 'd');
  const date = formatDay(cell.day, 'EEEE, d MMMM');
  const label = `${date}, ${cell.count === 0 ? CALENDAR_LABELS.noEvents : formatCount(cell.count)}`;
  const className = [styles.day, cell.inMonth ? '' : styles.outside, cell.isToday ? styles.today : '']
    .filter(Boolean)
    .join(' ');

  if (cell.isPast) {
    return (
      <span className={`${className} ${styles.past}`} aria-label={date}>
        {number}
      </span>
    );
  }
  return (
    <Link
      href={schoolsHref({ day: cell.day, month: monthOf(cell.day) }, dayDomId(cell.day))}
      className={className}
      aria-label={label}
      aria-current={cell.isToday ? 'date' : undefined}
    >
      {number}
      <DayMarkerDots cell={cell} />
    </Link>
  );
}

/** Kalendarz miesiąca: picking a day shows its week below; arrows change only the shown month. */
export function MonthCalendar({ calendar, selectedDay, today }: MonthCalendarProps) {
  const { month, weeks, previous, next } = calendar;
  const title = formatDay(firstDayOf(month), 'LLLL yyyy');

  return (
    <nav className={styles.calendar} aria-label={CALENDAR_LABELS.region}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.navigation}>
          {previous ? (
            <Link
              href={schoolsHref({ day: selectedDay, month: previous })}
              className={styles.arrow}
              aria-label={CALENDAR_LABELS.previousMonth}
            >
              ‹
            </Link>
          ) : (
            <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
              ‹
            </span>
          )}
          <Link href={schoolsHref({ day: today, month: monthOf(today) })} className={styles.todayLink}>
            {CALENDAR_LABELS.today}
          </Link>
          <Link
            href={schoolsHref({ day: selectedDay, month: next })}
            className={styles.arrow}
            aria-label={CALENDAR_LABELS.nextMonth}
          >
            ›
          </Link>
        </div>
      </div>
      <div className={styles.grid}>
        {WEEKDAY_SHORT_NAMES.map((name) => (
          <span key={name} className={styles.weekday} aria-hidden="true">
            {name}
          </span>
        ))}
        {weeks.map((week) => (
          <div
            key={week.monday}
            className={styles.week}
            data-current={week.isCurrent || undefined}
            data-selected={week.isSelected || undefined}
          >
            {week.days.map((cell) => (
              <DayCell key={cell.day} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
