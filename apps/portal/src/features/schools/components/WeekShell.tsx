import type { ReactNode } from 'react';
import { addDays, type CalendarDay } from '@events/time';
import { Header } from '@/features/events/components/Header';
import { ScrollHint } from '@/features/events/components/ScrollHint';
import { STRIP_LABELS } from '@/features/events/labels';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { SCHOOLS_LABELS } from '../labels';
import { monthOfWeek } from '../monthCalendar';
import { SchoolsCalendar } from './SchoolsCalendar';
import { WeekArrow } from './WeekArrow';
import styles from './WeekShell.module.css';

interface WeekShellProps {
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  readonly today: CalendarDay;
  readonly map: ReactNode;
  readonly children: ReactNode;
}

/** The part that stays on screen when the week changes: heading, calendar, arrows. The week itself comes in as `children`. */
export function WeekShell({ week, today, map, children }: WeekShellProps) {
  const range = { from: week, to: addDays(week, 6) };
  return (
    <OccurrenceSelectionProvider>
      <div className={styles.split}>
        <Header
          layout="split"
          sentence={SCHOOLS_LABELS.heading}
          controls={
            <SchoolsCalendar month={monthOfWeek(week)} week={week} today={today} />
          }
          rangeLabel={formatRangeLabel(range)}
          countLabel={null}
          map={map}
          controlsLabels={{ show: SCHOOLS_LABELS.calendarShow, hide: SCHOOLS_LABELS.calendarHide }}
        />
        <div className={styles.program}>
          <div className={styles.weekArrows}>
            <WeekArrow direction={-1} week={week} />
            <span className={styles.currentMonth}>
              {formatDay(week, 'LLLL yyyy')}
              <span className={styles.rangeLabel}>{formatRangeLabel(range)}</span>
            </span>
            <WeekArrow direction={1} week={week} />
          </div>
          <div className={styles.hint}>
            <ScrollHint label={STRIP_LABELS.scrollHint} direction={1} />
            <ScrollHint label={STRIP_LABELS.scrollBackHint} direction={-1} />
          </div>
          <div className={styles.strip}>{children}</div>
        </div>
      </div>
    </OccurrenceSelectionProvider>
  );
}
