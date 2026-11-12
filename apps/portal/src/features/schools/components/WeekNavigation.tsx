'use client';

import { createContext, startTransition, useContext, useEffect, useOptimistic, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDays, type CalendarDay } from '@events/time';
import { revealOccurrence } from '@/features/events/components/DayStrip';
import { StripSkeleton } from '@/features/events/components/WeekSkeleton';
import { formatRangeLabel } from '@/features/search/dateRange';
import { formatDay } from '@/lib/format';
import { schoolsHref } from '../schoolsHref';
import { useFiltersQuery } from '../filtersQueryContext';
import { weekFromPath } from '../weekParam';
import { MapDialog, MapDialogNav, MapDialogTitle } from './MapDialog';
import { WeekArrow } from './WeekArrow';

export interface WeekCounts {
  readonly week: CalendarDay;
  /** The filters' query the counts were made with, so a filter change does not show the old numbers. */
  readonly filtersQuery: string;
  readonly total: number;
  readonly days: Readonly<Record<string, number>>;
}

interface WeekNavigationValue {
  /** Monday of the shown week: the clicked one at once, before its events arrive. */
  readonly week: CalendarDay;
  /** A week change is on its way; the strip shows its skeleton meanwhile. */
  readonly pending: boolean;
  readonly navigate: (week: CalendarDay, anchor?: string) => void;
  /** Filtered event counts of the week the page last reported; its week tells whether they fit the one on screen. */
  readonly weekCounts: WeekCounts | null;
  readonly setWeekCounts: (weekCounts: WeekCounts) => void;
}

const WeekNavigationContext = createContext<WeekNavigationValue | null>(null);

export function useWeekNavigation(): WeekNavigationValue {
  const value = useContext(WeekNavigationContext);
  if (!value) throw new Error('useWeekNavigation needs a WeekNavigationProvider');
  return value;
}

interface WeekNavigationProviderProps {
  readonly today: CalendarDay;
  readonly children: ReactNode;
}

/** Lives in the schools layout, which outlasts week changes, so a week link reacts at once whatever the network. */
export function WeekNavigationProvider({ today, children }: WeekNavigationProviderProps) {
  const router = useRouter();
  const { week: raw } = useParams<{ week: string }>();
  const [week, setOptimisticWeek] = useOptimistic(weekFromPath(typeof raw === 'string' ? raw : '', today).week);
  const [pending, setPending] = useOptimistic(false);
  const [weekCounts, setWeekCounts] = useState<WeekCounts | null>(null);
  const filtersQuery = useFiltersQuery();

  // Both optimistic values hold until the navigation commits the new week
  function navigate(target: CalendarDay, anchor?: string) {
    startTransition(() => {
      setOptimisticWeek(target);
      setPending(true);
      router.push(schoolsHref(target, anchor, filtersQuery), { scroll: false });
    });
  }

  return (
    <WeekNavigationContext value={{ week, pending, navigate, weekCounts, setWeekCounts }}>
      {children}
    </WeekNavigationContext>
  );
}

// Fast week changes keep the old strip instead of flashing the skeleton
const SKELETON_DELAY_MS = 200;

/** The week's place in the layout: its skeleton once a week change takes longer than a moment. */
export function WeekArea({ children }: { readonly children: ReactNode }) {
  const { pending } = useWeekNavigation();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setSlow(true), SKELETON_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [pending]);

  return pending && slow ? <StripSkeleton /> : children;
}

/** The page's map dialog with the week arrows in its bar; it stays mounted across weeks. */
export function WeekMapDialog({ today }: { readonly today: CalendarDay }) {
  const { week, pending, navigate } = useWeekNavigation();
  return (
    <MapDialog
      busy={pending}
      onShowIn={revealOccurrence}
      nav={
        <MapDialogNav>
          <WeekArrow direction={-1} week={week} onNavigate={navigate} today={today} compact />
          <MapDialogTitle
            title={formatDay(week, 'LLLL yyyy')}
            subtitle={formatRangeLabel({ from: week, to: addDays(week, 6) })}
          />
          <WeekArrow direction={1} week={week} onNavigate={navigate} today={today} compact />
        </MapDialogNav>
      }
    />
  );
}

/** The week page reports its filtered event counts to the week header and the phone week row, which outlive week changes. */
export function WeekCount({ week, filtersQuery, total, days }: WeekCounts) {
  const { setWeekCounts } = useWeekNavigation();
  useEffect(() => {
    setWeekCounts({ week, filtersQuery, total, days });
  }, [week, filtersQuery, total, days, setWeekCounts]);
  return null;
}
