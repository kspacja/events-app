'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { addDays, type CalendarDay } from '@events/time';
import { Header } from '@/features/events/components/Header';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { SCHOOLS_LABELS } from '../labels';
import { FiltersQueryContext } from '../filtersQueryContext';
import { filtersQuery, parseFilters } from '../schoolFilters';
import { MonthCalendar } from './MonthCalendar';
import { AdvancedFiltersSheet, SchoolFilters } from './SchoolFilters';
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
        controls={<MonthCalendar week={week} today={today} onNavigate={navigate} />}
        rangeLabel={formatRangeLabel(range)}
        countLabel={null}
        map={<WeekMap />}
        aside={
          <div className={styles.advancedFilters}>
            <SchoolFilters placement="advanced" />
          </div>
        }
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
        <SchoolFilters placement="main" />
        <AdvancedFiltersSheet />
        <div className={styles.strip}>
          <WeekArea>{children}</WeekArea>
        </div>
      </div>
    </div>
  );
}

/** Everything on the schools page except the week itself; it stays mounted while the week changes. */
export function SchoolsShell({ today, children }: SchoolsShellProps) {
  const query = filtersQuery(parseFilters(new URLSearchParams(useSearchParams())));
  return (
    <FiltersQueryContext value={query}>
      <WeekNavigationProvider today={today}>
        <OccurrenceSelectionProvider>
          <ShellContent today={today}>{children}</ShellContent>
        </OccurrenceSelectionProvider>
      </WeekNavigationProvider>
    </FiltersQueryContext>
  );
}
