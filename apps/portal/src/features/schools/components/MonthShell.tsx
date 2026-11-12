'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CalendarDay } from '@events/time';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { FiltersQueryContext } from '../filtersQueryContext';
import { filtersQuery, parseFilters } from '../schoolFilters';
import styles from './MonthView.module.css';

interface MonthShellProps {
  readonly today: CalendarDay;
  /** The month page: its header and grid. */
  readonly children: ReactNode;
}

/** Everything on the month view except the month itself; it stays mounted while the month changes. */
export function MonthShell({ children }: MonthShellProps) {
  const query = filtersQuery(parseFilters(new URLSearchParams(useSearchParams())));
  return (
    <FiltersQueryContext value={query}>
      <OccurrenceSelectionProvider>
        <main className={styles.page}>{children}</main>
      </OccurrenceSelectionProvider>
    </FiltersQueryContext>
  );
}
