import type { CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import { CALENDAR_LABELS, MONTH_LABELS } from '../labels';
import { addMonths, firstDayOf, monthOf, type CalendarMonth } from '../monthCalendar';
import { schoolsMonthHref } from '../schoolsHref';
import { formatWeekCount } from '../weekCount';
import { PeriodArrow } from './WeekArrow';
import styles from './MonthView.module.css';

interface MonthHeaderProps {
  readonly month: CalendarMonth;
  readonly today: CalendarDay;
  readonly filtersQuery: string;
  readonly total: number;
  /** Events still ahead in the current month; null for a later one. */
  readonly upcoming: number | null;
}

export function MonthHeader({ month, today, filtersQuery, total, upcoming }: MonthHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.nav}>
        <PeriodArrow
          direction={-1}
          href={schoolsMonthHref(addMonths(month, -1), filtersQuery)}
          label={CALENDAR_LABELS.previousMonth}
          disabled={month <= monthOf(today)}
          compact
        />
        <h2 className={styles.month}>{formatDay(firstDayOf(month), 'LLLL yyyy')}</h2>
        <PeriodArrow
          direction={1}
          href={schoolsMonthHref(addMonths(month, 1), filtersQuery)}
          label={CALENDAR_LABELS.nextMonth}
          compact
        />
      </div>
      <span className={styles.count}>{formatWeekCount(total, upcoming, MONTH_LABELS.countScope)}</span>
    </div>
  );
}
