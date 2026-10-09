'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ScrollHint.module.css';

// A day and a half: the next day shows partly and the one after is cut
const STEP_IN_DAYS = 1.5;
// Sub-pixel rounding can leave the strip a pixel short of its edge
const EDGE_TOLERANCE = 1;

interface ScrollHintProps {
  readonly label: string;
  readonly direction: 1 | -1;
}

/** The nearest ancestor that holds the week strip. */
function stripAbove(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node && !node.querySelector('[data-day-strip]')) node = node.parentElement;
  return node?.querySelector<HTMLElement>('[data-day-strip]') ?? null;
}

/** A subtle button that scrolls the week strip by a day and a half; hidden once the strip is at the edge it would pass. */
export function ScrollHint({ label, direction }: ScrollHintProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [atEdge, setAtEdge] = useState(direction > 0 ? false : true);

  useEffect(() => {
    const strip = stripAbove(ref.current);
    if (!strip) return;

    function update() {
      if (!strip) return;
      const atStart = strip.scrollLeft <= EDGE_TOLERANCE;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - EDGE_TOLERANCE;
      setAtEdge(direction > 0 ? atEnd : atStart);
    }

    update();
    strip.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      strip.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [direction]);

  function scroll() {
    const strip = stripAbove(ref.current);
    const column = strip?.querySelector<HTMLElement>('[id^="day-"]');
    if (!strip || !column) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollBy({
      left: column.offsetWidth * STEP_IN_DAYS * direction,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={styles.button}
      data-hidden={atEdge || undefined}
      onClick={scroll}
    >
      {label}
    </button>
  );
}
