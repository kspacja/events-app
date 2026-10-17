'use client';

import { createContext, startTransition, useContext, useEffect, useOptimistic, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CalendarDay } from '@events/time';
import { EventsMapLoader } from '@/features/events/components/EventsMapLoader';
import { MapToggle } from '@/features/events/components/MapToggle';
import { SkipLink } from '@/features/events/components/SkipLink';
import { StripSkeleton } from '@/features/events/components/WeekSkeleton';
import type { MapPoint } from '@/features/events/mapView';
import { schoolsHref } from '../schoolsHref';
import { useFiltersQuery } from '../filtersQueryContext';
import { weekFromPath } from '../weekParam';

interface WeekMapState {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
}

const NO_POINTS: WeekMapState = { points: [], focus: [] };

interface WeekNavigationValue {
  /** Monday of the shown week: the clicked one at once, before its events arrive. */
  readonly week: CalendarDay;
  /** A week change is on its way; the strip shows its skeleton meanwhile. */
  readonly pending: boolean;
  readonly navigate: (week: CalendarDay, anchor?: string) => void;
  readonly map: WeekMapState;
  readonly setMap: (map: WeekMapState) => void;
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
  const [map, setMap] = useState(NO_POINTS);
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
    <WeekNavigationContext value={{ week, pending, navigate, map, setMap }}>{children}</WeekNavigationContext>
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

/** The map stays mounted across weeks; each week page only hands it new points. */
export function WeekMap() {
  const { map } = useWeekNavigation();
  return (
    <>
      <SkipLink />
      <MapToggle desktop="dialog">
        <EventsMapLoader points={map.points} focus={map.focus} />
      </MapToggle>
    </>
  );
}

export function WeekMapPoints({ points, focus }: WeekMapState) {
  const { setMap } = useWeekNavigation();
  useEffect(() => {
    setMap({ points, focus });
  }, [points, focus, setMap]);
  return null;
}
