'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useOccurrenceSelection, useOccurrenceSelectionInstructions } from '../OccurrenceSelectionProvider';
import { MAP_LABELS } from '../labels';
import styles from './MapToggle.module.css';

const DESKTOP_QUERY = '(min-width: 769px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getIsDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerIsDesktop = () => false;

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

interface MapToggleProps {
  readonly children: ReactNode;
  /** Desktop only: `inline` shows the map in place, `dialog` keeps it behind a button that opens a modal. */
  readonly desktop?: 'inline' | 'dialog';
}

export function MapToggle({ children, desktop = 'inline' }: MapToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const descriptionId = `${panelId}-description`;
  const figureRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isDesktop = useSyncExternalStore(subscribe, getIsDesktop, getServerIsDesktop);
  const inDialog = desktop === 'dialog' && isDesktop;
  const selection = useOccurrenceSelection();
  const { expandMap } = useOccurrenceSelectionInstructions();

  if (expandMap && !expanded) setExpanded(true);

  useEffect(() => {
    if (!expandMap) return;
    selection.done('expandMap');
    if (inDialog) return;
    // Wait for the collapsed panel to become visible before measuring it
    requestAnimationFrame(() => {
      figureRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    });
  }, [expandMap, selection, inDialog]);

  // Opens before the lazily loaded map mounts, so it measures a visible container
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded, inDialog]);

  if (inDialog) {
    return (
      <>
        <button type="button" className={`${styles.button} ${styles.dialogButton}`} onClick={() => setExpanded(true)}>
          <MapIcon />
          {MAP_LABELS.open}
        </button>
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label={MAP_LABELS.region}
          onClose={() => setExpanded(false)}
          onClick={(event) => {
            // A click on the backdrop lands on the dialog itself
            if (event.target === event.currentTarget) setExpanded(false);
          }}
        >
          <button type="button" className={styles.close} onClick={() => setExpanded(false)}>
            {MAP_LABELS.close}
          </button>
          <figure ref={figureRef} className={styles.dialogPanel}>
            {expanded ? children : null}
          </figure>
        </dialog>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        <MapIcon />
        {expanded ? MAP_LABELS.hide : MAP_LABELS.show}
      </button>
      <span id={descriptionId} className="visually-hidden">
        {MAP_LABELS.description}
      </span>
      <figure
        ref={figureRef}
        id={panelId}
        className={styles.panel}
        data-expanded={expanded}
        aria-label={MAP_LABELS.region}
        aria-describedby={descriptionId}
      >
        {expanded || isDesktop ? children : null}
      </figure>
    </>
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
