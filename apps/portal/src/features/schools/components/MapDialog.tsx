'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { OccurrenceId } from '@events/contract/listing';
import { EventsMapLoader } from '@/features/events/components/EventsMapLoader';
import { MAP_LABELS } from '@/features/events/labels';
import { useOccurrenceSelection, useOccurrenceSelectionInstructions } from '@/features/events/OccurrenceSelectionProvider';
import type { MapPoint } from '@/features/events/mapView';
import styles from './MapDialog.module.css';

export interface MapPointsState {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
}

const NO_POINTS: MapPointsState = { points: [], focus: [] };

interface MapDialogValue {
  readonly map: MapPointsState;
  readonly setMap: (map: MapPointsState) => void;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

const MapDialogContext = createContext<MapDialogValue | null>(null);

export function useMapDialog(): MapDialogValue {
  const value = useContext(MapDialogContext);
  if (!value) throw new Error('useMapDialog needs a MapDialogProvider');
  return value;
}

/** Lives in a layout that outlasts its pages, so the dialog stays open while the shown period changes. */
export function MapDialogProvider({ children }: { readonly children: ReactNode }) {
  const [map, setMap] = useState(NO_POINTS);
  const [open, setOpen] = useState(false);
  return <MapDialogContext value={{ map, setMap, open, setOpen }}>{children}</MapDialogContext>;
}

interface MapDialogProps {
  /** The period switcher in the dialog's bar, e.g. week or month arrows. */
  readonly nav?: ReactNode;
  /** The next period's points are on their way. */
  readonly busy?: boolean;
  /** Takes the user from a map popup to the occurrence on the page, after the dialog has closed. */
  readonly onShowIn: (occurrenceId: OccurrenceId) => void;
  readonly showInLabel?: string;
}

/** One map dialog for the page, opened by any MapButton or by a card's pin. */
export function MapDialog({ nav, busy = false, onShowIn, showInLabel }: MapDialogProps) {
  const { map, open, setOpen } = useMapDialog();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selection = useOccurrenceSelection();
  const { expandMap } = useOccurrenceSelectionInstructions();

  useEffect(() => {
    if (!expandMap) return;
    selection.done('expandMap');
    setOpen(true);
  }, [expandMap, selection, setOpen]);

  // Opens before the lazily loaded map mounts, so it measures a visible container
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function showIn(occurrenceId: OccurrenceId) {
    selection.close();
    setOpen(false);
    // After the closed dialog has handed focus back to its opener
    requestAnimationFrame(() => onShowIn(occurrenceId));
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={MAP_LABELS.region}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className={styles.bar}>
        <button type="button" className={styles.close} onClick={() => setOpen(false)}>
          {MAP_LABELS.close}
        </button>
        {nav}
      </div>
      <figure className={styles.panel} aria-busy={busy}>
        {open ? (
          <EventsMapLoader points={map.points} focus={map.focus} onShowInWeek={showIn} showInLabel={showInLabel} />
        ) : null}
      </figure>
    </dialog>
  );
}

/** The period's title between its arrows, in the dialog's bar. */
export function MapDialogNav({ children }: { readonly children: ReactNode }) {
  return <div className={styles.weekNav}>{children}</div>;
}

export function MapDialogTitle({ title, subtitle }: { readonly title: string; readonly subtitle?: string }) {
  return (
    <span className={styles.week} aria-live="polite">
      {title}
      {subtitle ? <span className={styles.range}>{subtitle}</span> : null}
    </span>
  );
}

/** Opens the map dialog: labelled in a sidebar, an icon beside a heading, or a pill floating over the page. */
export function MapButton({ variant }: { readonly variant: 'label' | 'icon' | 'floating' }) {
  const { setOpen } = useMapDialog();
  const className = { label: styles.labelButton, icon: styles.iconButton, floating: styles.floatingButton }[variant];
  return (
    <button
      type="button"
      className={className}
      aria-label={variant === 'icon' ? MAP_LABELS.open : undefined}
      onClick={() => setOpen(true)}
    >
      <MapIcon />
      {variant === 'icon' ? null : MAP_LABELS.open}
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

/** A page hands its points to the dialog, which outlives it. */
export function MapPoints({ points, focus }: MapPointsState) {
  const { setMap } = useMapDialog();
  useEffect(() => {
    setMap({ points, focus });
  }, [points, focus, setMap]);
  return null;
}
