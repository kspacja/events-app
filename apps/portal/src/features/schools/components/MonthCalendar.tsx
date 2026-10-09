import Link from 'next/link';
import { mondayOf, type CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import { DAY_NAMES } from '@/features/events/labels';
import { DayJump } from '@/features/events/components/DayJump';
import { formatCount } from '@/features/events/schedule';
import { dayDomId } from '@/features/events/scheduleDom';
import { CALENDAR_LABELS, WEEKDAY_SHORT_NAMES } from '../labels';
import { firstDayOf, monthOf, type CalendarCell, type CalendarWeek, type MonthView } from '../monthCalendar';
import { schoolsHref } from '../schoolsHref';
import styles from './MonthCalendar.module.css';

// One calendar per page, so a fixed id is enough to label its table
const TITLE_ID = 'month-calendar-title';

interface MonthCalendarProps {
  readonly calendar: MonthView;
  /** Monday of the shown week. */
  readonly shownWeek: CalendarDay;
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

function weekState(week: CalendarWeek): string[] {
  return [
    ...(week.isCurrent ? [CALENDAR_LABELS.currentWeek] : []),
    ...(week.isSelected ? [CALENDAR_LABELS.selectedWeek] : []),
  ];
}

function DayCell({ cell, week, shownWeek }: { readonly cell: CalendarCell; readonly week: CalendarWeek; readonly shownWeek: CalendarDay }) {
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
  const count = cell.count === 0 ? CALENDAR_LABELS.noEvents : formatCount(cell.count);
  return (
    <DayJump
      day={cell.day}
      shownWeek={shownWeek}
      href={schoolsHref({ week: mondayOf(cell.day), month: monthOf(cell.day) }, dayDomId(cell.day))}
      className={className}
      aria-label={[date, count, ...weekState(week)].join(', ')}
      aria-current={cell.isToday ? 'date' : undefined}
    >
      {number}
      <DayMarkerDots cell={cell} />
    </DayJump>
  );
}

/** Kalendarz miesiąca: a day scrolls to it within the shown week or moves to its week; arrows change only the shown month. */
export function MonthCalendar({ calendar, shownWeek, today }: MonthCalendarProps) {
  const { month, weeks, previous, next } = calendar;

  return (
    <nav className={styles.calendar} aria-label={CALENDAR_LABELS.region}>
      <div className={styles.toolbar}>
        <h2 id={TITLE_ID} className={styles.title}>
          {formatDay(firstDayOf(month), 'LLLL yyyy')}
        </h2>
        <div className={styles.navigation}>
          {previous ? (
            <Link
              href={schoolsHref({ week: shownWeek, month: previous })}
              scroll={false}
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
          <Link href={schoolsHref({ week: mondayOf(today), month: monthOf(today) })} scroll={false} className={styles.todayLink}>
            {CALENDAR_LABELS.today}
          </Link>
          <Link
            href={schoolsHref({ week: shownWeek, month: next })}
            scroll={false}
            className={styles.arrow}
            aria-label={CALENDAR_LABELS.nextMonth}
          >
            ›
          </Link>
        </div>
      </div>
      <table className={styles.grid} aria-labelledby={TITLE_ID}>
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
          {weeks.map((week) => (
            <tr
              key={week.monday}
              className={styles.week}
              data-current={week.isCurrent || undefined}
              data-selected={week.isSelected || undefined}
            >
              {week.days.map((cell) => (
                <td key={cell.day} className={styles.cell}>
                  <DayCell cell={cell} week={week} shownWeek={shownWeek} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </nav>
  );
}
