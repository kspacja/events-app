'use client';

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CalendarDay } from '@events/time';
import { EventsMapLoader } from '@/features/events/components/EventsMapLoader';
import { MAP_LABELS } from '@/features/events/labels';
import { useOccurrenceSelection, useOccurrenceSelectionInstructions } from '@/features/events/OccurrenceSelectionProvider';
import { StripSkeleton } from '@/features/events/components/WeekSkeleton';
import type { MapPoint } from '@/features/events/mapView';
import { schoolsHref } from '../schoolsHref';
import { useFiltersQuery } from '../filtersQueryContext';
import styles from './WeekMap.module.css';
import { weekFromPath } from '../weekParam';

interface WeekMapState {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
}

const NO_POINTS: WeekMapState = { points: [], focus: [] };

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
  readonly map: WeekMapState;
  readonly setMap: (map: WeekMapState) => void;
  /** Filtered event counts of the week the page last reported; its week tells whether they fit the one on screen. */
  readonly weekCounts: WeekCounts | null;
  readonly setWeekCounts: (weekCounts: WeekCounts) => void;
  readonly mapOpen: boolean;
  readonly setMapOpen: (open: boolean) => void;
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
  const [weekCounts, setWeekCounts] = useState<WeekCounts | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
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
    <WeekNavigationContext value={{ week, pending, navigate, map, setMap, weekCounts, setWeekCounts, mapOpen, setMapOpen }}>
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

/** One map dialog for the page, opened by any MapButton or by a card's pin; it stays mounted across weeks. */
export function WeekMapDialog() {
  const { map, mapOpen, setMapOpen } = useWeekNavigation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selection = useOccurrenceSelection();
  const { expandMap } = useOccurrenceSelectionInstructions();

  useEffect(() => {
    if (!expandMap) return;
    selection.done('expandMap');
    setMapOpen(true);
  }, [expandMap, selection, setMapOpen]);

  // Opens before the lazily loaded map mounts, so it measures a visible container
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mapOpen && !dialog.open) dialog.showModal();
    if (!mapOpen && dialog.open) dialog.close();
  }, [mapOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={MAP_LABELS.region}
      onClose={() => setMapOpen(false)}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself
        if (event.target === event.currentTarget) setMapOpen(false);
      }}
    >
      <button type="button" className={styles.close} onClick={() => setMapOpen(false)}>
        {MAP_LABELS.close}
      </button>
      <figure className={styles.panel}>
        {mapOpen ? <EventsMapLoader points={map.points} focus={map.focus} /> : null}
      </figure>
    </dialog>
  );
}

/** Opens the map dialog: with its label in the desktop sidebar, as an icon beside the month on phones. */
export function MapButton({ variant }: { readonly variant: 'label' | 'icon' }) {
  const { setMapOpen } = useWeekNavigation();
  return (
    <button
      type="button"
      className={variant === 'icon' ? styles.iconButton : styles.labelButton}
      aria-label={variant === 'icon' ? MAP_LABELS.open : undefined}
      onClick={() => setMapOpen(true)}
    >
      <MapIcon />
      {variant === 'label' ? MAP_LABELS.open : null}
    </button>
  );
}

function MapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function WeekMapPoints({ points, focus }: WeekMapState) {
  const { setMap } = useWeekNavigation();
  useEffect(() => {
    setMap({ points, focus });
  }, [points, focus, setMap]);
  return null;
}

/** The week page reports its filtered event counts to the week header and the phone week row, which outlive week changes. */
export function WeekCount({ week, filtersQuery, total, days }: WeekCounts) {
  const { setWeekCounts } = useWeekNavigation();
  useEffect(() => {
    setWeekCounts({ week, filtersQuery, total, days });
  }, [week, filtersQuery, total, days, setWeekCounts]);
  return null;
}
