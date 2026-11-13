import type { CalendarDay } from '@events/time';
import { formatCount } from '@/features/events/schedule';
import { formatDay } from '@/lib/format';
import { CALENDAR_LABELS } from '../labels';
import { addMonths, firstDayOf, monthOf, type CalendarMonth } from '../monthCalendar';
import { schoolsMonthHref } from '../schoolsHref';
import { MapButton } from './MapDialog';
import { FiltersDialog, SchoolFilters } from './SchoolFilters';
import { PeriodArrow } from './WeekArrow';
import { WeekJumps } from './WeekJumps';
import type { WeekJump } from '../monthWeeks';
import styles from './MonthDock.module.css';

interface MonthDockProps {
  readonly month: CalendarMonth;
  readonly today: CalendarDay;
  readonly filtersQuery: string;
  readonly total: number;
  /** Phones: the month's weeks, as a second row of the dock. */
  readonly jumps: readonly WeekJump[];
}

/** Month switcher, main filters and the dialogs' buttons, floating over the bottom of the page. */
export function MonthDock({ month, today, filtersQuery, total, jumps }: MonthDockProps) {
  return (
    <div className={styles.dock}>
      <div className={styles.period}>
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
        <span className={styles.count}>{formatCount(total)}</span>
      </div>
      <div className={styles.filters}>
        <SchoolFilters placement="main" layout="rows" />
      </div>
      <div className={styles.actions}>
        <span className={styles.wide}>
          <FiltersDialog trigger="dock" />
        </span>
        <span className={styles.narrow}>
          <FiltersDialog trigger="dock" placements={['main', 'advanced']} />
        </span>
        <MapButton variant="dock" />
      </div>
      <WeekJumps jumps={jumps} />
    </div>
  );
}
