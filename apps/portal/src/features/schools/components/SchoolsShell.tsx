'use client';

import type { ReactNode } from 'react';
import { addDays, type CalendarDay } from '@events/time';
import { Header } from '@/features/events/components/Header';
import { ScrollHint } from '@/features/events/components/ScrollHint';
import { STRIP_LABELS } from '@/features/events/labels';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { SCHOOLS_LABELS } from '../labels';
import { MonthCalendar } from './MonthCalendar';
import { WeekArea, WeekMap, WeekNavigationProvider, useWeekNavigation } from './WeekNavigation';
import { WeekArrow } from './WeekArrow';
import styles from './SchoolsShell.module.css';

interface SchoolsShellProps {
  readonly today: CalendarDay;
  /** The week page: its strip. */
  readonly children: ReactNode;
}

function ShellContent({ today, children }: SchoolsShellProps) {
  const { week, navigate } = useWeekNavigation();
  const range = { from: week, to: addDays(week, 6) };
  return (
    <div className={styles.split}>
      <Header
        layout="split"
        sentence={SCHOOLS_LABELS.heading}
        sentencePlace="beside"
        controls={<MonthCalendar week={week} today={today} onNavigate={navigate} />}
        rangeLabel={formatRangeLabel(range)}
        countLabel={null}
        map={<WeekMap />}
        controlsLabels={{ show: SCHOOLS_LABELS.calendarShow, hide: SCHOOLS_LABELS.calendarHide }}
      />
      <div className={styles.program}>
        <div className={styles.weekArrows}>
          <WeekArrow direction={-1} week={week} onNavigate={navigate} />
          <span className={styles.currentMonth}>
            {formatDay(week, 'LLLL yyyy')}
            <span className={styles.rangeLabel}>{formatRangeLabel(range)}</span>
          </span>
          <WeekArrow direction={1} week={week} onNavigate={navigate} />
        </div>
        <div className={styles.hint}>
          <ScrollHint label={STRIP_LABELS.scrollHint} direction={1} />
          <ScrollHint label={STRIP_LABELS.scrollBackHint} direction={-1} />
        </div>
        <div className={styles.strip}>
          <WeekArea>{children}</WeekArea>
        </div>
      </div>
    </div>
  );
}

/** Everything on the schools page except the week itself; it stays mounted while the week changes. */
export function SchoolsShell({ today, children }: SchoolsShellProps) {
  return (
    <WeekNavigationProvider today={today}>
      <OccurrenceSelectionProvider>
        <ShellContent today={today}>{children}</ShellContent>
      </OccurrenceSelectionProvider>
    </WeekNavigationProvider>
  );
}
