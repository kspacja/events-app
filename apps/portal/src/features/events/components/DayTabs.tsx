import { type CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import { DAY_NAMES, DAY_SHORT_NAMES, UI_LABELS } from '../labels';
import { dayDomId } from '../scheduleDom';
import type { RangeNavigation } from './Header';
import { DayJump } from './DayJump';
import styles from './DayTabs.module.css';

interface DayTabsProps {
  readonly days: readonly { readonly day: CalendarDay; readonly weekdayIndex: number; readonly count: number }[];
  /** Monday of the week on screen. */
  readonly shownWeek: CalendarDay;
  /** Week arrows on both ends of the row. */
  readonly rangeNavigation?: RangeNavigation;
}

/** One tab per day of the week; a tab only scrolls the strip to its day. Dots show how many events the day has. */
export function DayTabs({ days, shownWeek, rangeNavigation }: DayTabsProps) {
  return (
    <>
      <div className={styles.tabs} role="group" aria-label={UI_LABELS.schedule}>
        {rangeNavigation?.previous}
        {days.map(({ day, weekdayIndex }) => (
          <DayJump
            key={day}
            day={day}
            shownWeek={shownWeek}
            href={`#${dayDomId(day)}`}
            className={styles.tab}
            aria-label={`${DAY_NAMES[weekdayIndex]}, ${formatDay(day, 'd MMMM')}`}
          >
            <span aria-hidden="true">{DAY_SHORT_NAMES[weekdayIndex]}</span>
            <span aria-hidden="true" className={styles.number}>
              {formatDay(day, 'd')}{' '}
            </span>
            {/* <span aria-hidden="true" className={styles.month}>
              {formatDay(day, 'MMM')}
            </span>
            <span aria-hidden="true" className={styles.dots}>
              {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, index) => (
                <span key={index} className={styles.dot} />
              ))}
            </span> */}
          </DayJump>
        ))}
        {rangeNavigation?.next}
      </div>
    </>
  );
}
