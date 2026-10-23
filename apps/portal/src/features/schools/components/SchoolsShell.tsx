'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { addDays, type CalendarDay } from '@events/time';
import { Header } from '@/features/events/components/Header';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { formatCount } from '@/features/events/schedule';
import { SCHOOLS_LABELS } from '../labels';
import { FiltersQueryContext, useFiltersQuery } from '../filtersQueryContext';
import { monthOf } from '../monthCalendar';
import { cachedWeekTotal, loadMonthCounts } from '../monthCounts';
import { shiftWeek } from '../weekShift';
import { filtersQuery, parseFilters } from '../schoolFilters';
import { MonthCalendar, WeekRow } from './MonthCalendar';
import { AdvancedFiltersSheet, SchoolFilters } from './SchoolFilters';
import { MapButton, WeekArea, WeekMapDialog, WeekNavigationProvider, useWeekNavigation } from './WeekNavigation';
import { WeekArrow } from './WeekArrow';
import styles from './SchoolsShell.module.css';

interface SchoolsShellProps {
  readonly today: CalendarDay;
  /** The week page: its strip. */
  readonly children: ReactNode;
}

/** Phones: the shown week's row of the calendar, swapped for the whole month on demand; `leading` shares the button row. */
function PhoneWeekPicker({ today, leading }: { readonly today: CalendarDay; readonly leading?: ReactNode }) {
  const { week, navigate, weekCounts } = useWeekNavigation();
  const filtersQuery = useFiltersQuery();
  const fits = weekCounts?.week === week && weekCounts.filtersQuery === filtersQuery;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  // Warm the month counts around the shown week, so the next or previous week's dots show at once
  useEffect(() => {
    const weeks = [shiftWeek(week, -1), week, shiftWeek(week, 1)];
    const months = new Set(weeks.flatMap((monday) => [monthOf(monday), monthOf(addDays(monday, 6))]));
    for (const month of months) void loadMonthCounts(month, filtersQuery);
  }, [week, filtersQuery]);
  return (
    <div className={styles.weekPicker}>
      <div className={styles.pickerBar}>
        {leading}
        <button
          type="button"
          className={styles.calendarToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? SCHOOLS_LABELS.calendarHide : SCHOOLS_LABELS.calendarShow}
        </button>
      </div>
      <div id={panelId}>
        {expanded ? (
          <MonthCalendar week={week} today={today} onNavigate={navigate} />
        ) : (
          <div className={styles.weekRowNav}>
            <WeekArrow direction={-1} week={week} onNavigate={navigate} today={today} compact />
            <WeekRow
              week={week}
              today={today}
              onNavigate={navigate}
              dayCounts={fits ? weekCounts.days : undefined}
            />
            <WeekArrow direction={1} week={week} onNavigate={navigate} today={today} compact />
          </div>
        )}
      </div>
    </div>
  );
}

function ShellContent({ today, children }: SchoolsShellProps) {
  const { week, navigate, weekCounts } = useWeekNavigation();
  const filtersQuery = useFiltersQuery();
  // The page's count once it reports this week; until then, optimistically, the sum of month counts already in the browser
  const fits = weekCounts?.week === week && weekCounts.filtersQuery === filtersQuery;
  const count = fits ? weekCounts.total : cachedWeekTotal(week, filtersQuery);
  const range = { from: week, to: addDays(week, 6) };
  return (
    <div className={styles.split}>
      <Header
        layout="split"
        controls={<MonthCalendar week={week} today={today} onNavigate={navigate} />}
        rangeLabel={formatRangeLabel(range)}
        countLabel={null}
        map={<MapButton variant="label" />}
        aside={
          <div className={styles.advancedFilters}>
            <SchoolFilters placement="advanced" />
          </div>
        }
        sidebarOnPhones={false}
      />
      <div className={styles.program}>
        <div className={styles.weekArrows}>
          <WeekArrow direction={-1} week={week} onNavigate={navigate} today={today} />
          <span className={styles.currentMonth}>
            {formatDay(week, 'LLLL yyyy')}
            <span className={styles.rangeLabel}>
              {formatRangeLabel(range)}
              {count !== null ? (
                <>
                  {' · '}
                  <span className={styles.count}>{formatCount(count)}</span>
                </>
              ) : null}
            </span>
          </span>
          <WeekArrow direction={1} week={week} onNavigate={navigate} today={today} />
          <span className={styles.phoneMap}>
            <MapButton variant="icon" />
          </span>
        </div>
        <SchoolFilters placement="main" />
        <PhoneWeekPicker today={today} leading={<AdvancedFiltersSheet />} />
        <div className={styles.strip}>
          <WeekArea>{children}</WeekArea>
        </div>
      </div>
      <WeekMapDialog today={today} />
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
