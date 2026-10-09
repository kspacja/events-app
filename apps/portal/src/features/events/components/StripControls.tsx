'use client';

import { useEffect, useRef, useState } from 'react';
import type { CalendarDay } from '@events/time';
import { STRIP_LABELS } from '../labels';
import { dayDomId } from '../scheduleDom';
import { scrollStripToDay } from './DayStrip';
import styles from './StripControls.module.css';

// Sub-pixel rounding can leave the strip a pixel short of its edge
const EDGE_TOLERANCE = 1;

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

/** Floating controls over the week strip: a fade and day buttons on the right, day buttons on the left. Never blocks the strip itself. */
export function StripControls({ days }: StripControlsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ atStart: true, atEnd: false });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const overlay = ref.current;
    const area = overlay?.parentElement;
    const element = stripOf(overlay);
    if (!overlay || !area || !element) return;

    function update() {
      if (!element) return;
      const atStart = element.scrollLeft <= EDGE_TOLERANCE;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE_TOLERANCE;
      setEdges((previous) =>
        previous.atStart === atStart && previous.atEnd === atEnd ? previous : { atStart, atEnd },
      );
    }
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);

    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    area.addEventListener('pointerenter', enter);
    area.addEventListener('pointerleave', leave);
    return () => {
      element.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      area.removeEventListener('pointerenter', enter);
      area.removeEventListener('pointerleave', leave);
    };
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

  function stepTo(index: number) {
    scrollStripToDay(days[index], scrollBehavior());
  }

  return (
    <div ref={ref} className={styles.overlay} data-hovered={hovered || undefined}>
      <div className={styles.fadeEnd} data-hidden={edges.atEnd || undefined} />
      <div className={styles.start} data-hidden={edges.atStart || undefined}>
        <button
          type="button"
          className={styles.button}
          
          data-sign="◀"
          onClick={() => stepTo(Math.max(shownIndex() - 1, 0))}
        >
          <span className={styles['hidden-label']}>{STRIP_LABELS.previousDay}</span>
        </button>
        <button type="button" data-sign="◀◀" className={styles.button} aria-label={STRIP_LABELS.firstDay} onClick={() => stepTo(0)}>
          <span className={styles['hidden-label']}>{STRIP_LABELS.firstDay}</span>
        </button>
      </div>
      <div className={styles.end} data-hidden={edges.atEnd || undefined}>
        <button
          type="button"
          data-sign="▶"
          className={styles.button}
          aria-label={STRIP_LABELS.nextDay}
          onClick={() => stepTo(Math.min(shownIndex() + 1, days.length - 1))}
        >
          <span className={styles['hidden-label']}>{STRIP_LABELS.nextDay}</span>
          
        </button>
        <button
          type="button"
          data-sign="▶▶"
          className={styles.button}
          aria-label={STRIP_LABELS.lastDay}
          onClick={() => stepTo(days.length - 1)}
        >
          <span className={styles['hidden-label']}>{STRIP_LABELS.lastDay}</span>
        </button>
      </div>
    </div>
  );
}
