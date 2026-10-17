'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CalendarDay } from '@events/time';
import { STRIP_LABELS } from '../labels';
import { dayDomId } from '../scheduleDom';
import { scrollStripToDay } from './DayStrip';
import styles from './StripControls.module.css';

// Sub-pixel rounding can leave the strip a pixel short of its edge
const EDGE_TOLERANCE = 1;
const STEP_IN_DAYS = 2;

interface StripControlsProps {
  /** The days of the week, in order. */
  readonly days: readonly CalendarDay[];
}

interface Edges {
  readonly atStart: boolean;
  readonly atEnd: boolean;
}

function stripOf(anchor: HTMLElement | null): HTMLElement | null {
  return anchor?.parentElement?.querySelector<HTMLElement>('[data-day-strip]') ?? null;
}

/** Floating controls over the week strip: a fade on the right and arrows in the bleeds that scroll by three days. Never blocks the strip itself. */
export function StripControls({ days }: StripControlsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ atStart: true, atEnd: false });

  useEffect(() => {
    const element = stripOf(ref.current);
    if (!element) return;

    function update() {
      if (!element) return;
      const atStart = element.scrollLeft <= EDGE_TOLERANCE;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE_TOLERANCE;
      setEdges((previous) =>
        previous.atStart === atStart && previous.atEnd === atEnd ? previous : { atStart, atEnd },
      );
    }

    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      element.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Arrows sit in the middle of the strip's visible part: low while the strip enters, at mid-screen while it fills it.
  // A layout effect places them before the first paint; until then CSS keeps them hidden, so they never jump.
  useLayoutEffect(() => {
    const overlay = ref.current;

    if (overlay) {
      overlay.dataset.placed = '';
    }
  }, []);

  function scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  // The column nearest the left edge of the strip counts as the one on screen
  function shownIndex(): number {
    const element = stripOf(ref.current);
    if (!element) return 0;
    const padding = parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    let best = 0;
    let bestDistance = Infinity;
    days.forEach((day, index) => {
      const column = document.getElementById(dayDomId(day));
      if (!column) return;
      const distance = Math.abs(column.offsetLeft - padding - element.scrollLeft);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  }

  function step(direction: 1 | -1) {
    const index = Math.min(Math.max(shownIndex() + STEP_IN_DAYS * direction, 0), days.length - 1);
    scrollStripToDay(days[index], scrollBehavior());
  }

  return (
    <div ref={ref} className={styles.overlay}>
      <div className={styles.fadeEnd} data-hidden={edges.atEnd || undefined} />
      <div className={`${styles.rail} ${styles.railStart}`}>
        <button
          type="button"
          className={`${styles.arrow} ${styles['arrow-left']}`}
          data-hidden={edges.atStart || undefined}
          aria-label={STRIP_LABELS.earlierDays}
          onClick={() => step(-1)}
        >
          <ArrowIcon flipped />
        </button>
      </div>
      <div className={`${styles.rail} ${styles.railEnd}`}>
        <button
          type="button"
          className={`${styles.arrow} ${styles['arrow-right']}`}
          data-hidden={edges.atEnd || undefined}
          aria-label={STRIP_LABELS.laterDays}
          onClick={() => step(1)}
        >
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

function ArrowIcon({ flipped = false }: { readonly flipped?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="25" height="25" aria-hidden="true" style={flipped ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
