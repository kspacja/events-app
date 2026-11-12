'use client';

import type { ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { CalendarDay } from '@events/time';
import { MAP_LABELS } from '@/features/events/labels';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { formatDay } from '@/lib/format';
import { CALENDAR_LABELS } from '../labels';
import { FiltersQueryContext } from '../filtersQueryContext';
import { addMonths, firstDayOf, monthOf } from '../monthCalendar';
import { monthFromPath } from '../monthParam';
import { schoolsMonthHref } from '../schoolsHref';
import { filtersQuery, parseFilters } from '../schoolFilters';
import { MapButton, MapDialog, MapDialogNav, MapDialogTitle, MapDialogProvider } from './MapDialog';
import { revealInMonth } from './MonthGrid';
import { FiltersDialog, SchoolFilters } from './SchoolFilters';
import { PeriodArrow } from './WeekArrow';
import styles from './MonthView.module.css';

interface MonthShellProps {
  readonly today: CalendarDay;
  /** The month page: its header and grid. */
  readonly children: ReactNode;
}

/** Everything on the month view except the month itself; it stays mounted while the month changes. */
export function MonthShell({ today, children }: MonthShellProps) {
  const query = filtersQuery(parseFilters(new URLSearchParams(useSearchParams())));
  return (
    <FiltersQueryContext value={query}>
      <OccurrenceSelectionProvider>
        <MapDialogProvider>
          <main className={styles.page}>{children}</main>
          <div className={styles.floating}>
            <MapButton variant="floating" />
            <FiltersDialog trigger="floating" />
          </div>
          <MonthMapDialog today={today} filtersQuery={query} />
        </MapDialogProvider>
      </OccurrenceSelectionProvider>
    </FiltersQueryContext>
  );
}

/** The month's map, with its own month arrows; it stays open while the month changes. */
function MonthMapDialog({ today, filtersQuery }: { readonly today: CalendarDay; readonly filtersQuery: string }) {
  const { month: raw } = useParams<{ month: string }>();
  const month = monthFromPath(typeof raw === 'string' ? raw : '', today);
  return (
    <MapDialog
      onShowIn={revealInMonth}
      showInLabel={MAP_LABELS.showInMonth}
      nav={
        <MapDialogNav>
          <PeriodArrow
            direction={-1}
            href={schoolsMonthHref(addMonths(month, -1), filtersQuery)}
            label={CALENDAR_LABELS.previousMonth}
            disabled={month <= monthOf(today)}
            compact
          />
          <MapDialogTitle title={formatDay(firstDayOf(month), 'LLLL yyyy')} />
          <PeriodArrow
            direction={1}
            href={schoolsMonthHref(addMonths(month, 1), filtersQuery)}
            label={CALENDAR_LABELS.nextMonth}
            compact
          />
        </MapDialogNav>
      }
    />
  );
}

/** The main filters, stuck to the top while the month scrolls under them. */
export function MonthFiltersBar() {
  return (
    <div className={styles.filters}>
      <SchoolFilters placement="main" />
    </div>
  );
}
