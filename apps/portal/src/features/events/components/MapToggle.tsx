'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useEventSelectionStore } from '../EventSelectionProvider';
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
}

export function MapToggle({ children }: MapToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const descriptionId = `${panelId}-description`;
  const figureRef = useRef<HTMLElement>(null);
  const isDesktop = useSyncExternalStore(subscribe, getIsDesktop, getServerIsDesktop);
  const selectionStore = useEventSelectionStore();

  useEffect(() => {
    let handledSeq = 0;
    return selectionStore.subscribe(() => {
      const selection = selectionStore.getSelection();
      if (selection?.source !== 'card' || selection.seq === handledSeq) return;
      handledSeq = selection.seq;
      setExpanded(true);
      // Wait for the collapsed panel to become visible before measuring it
      requestAnimationFrame(() => {
        figureRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
      });
    });
  }, [selectionStore]);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
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
