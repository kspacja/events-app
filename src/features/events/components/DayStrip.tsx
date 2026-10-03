'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { SCHEDULE_DOM } from '../scheduleDom';

const PAGE_SCROLL_MARGIN = 24;

interface DayStripProps {
  readonly className: string;
  readonly rangeKey: string;
  readonly timeKey: string | null;
  readonly children: ReactNode;
}

export function DayStrip({ className, rangeKey, timeKey, children }: DayStripProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const firstEvent = timeKey ? topmostActiveEvent(strip) : null;
    const column =
      firstEvent?.closest<HTMLElement>(SCHEDULE_DOM.anyColumnSelector) ??
      strip.querySelector<HTMLElement>(SCHEDULE_DOM.inRangeColumnSelector);
    if (!column) return;

    const padding = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
    strip.scrollLeft = column.offsetLeft - padding;

    if (firstEvent) {
      const top = firstEvent.getBoundingClientRect().top + window.scrollY - PAGE_SCROLL_MARGIN;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [rangeKey, timeKey]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function topmostActiveEvent(strip: HTMLElement): HTMLElement | null {
  const cards = strip.querySelectorAll<HTMLElement>(SCHEDULE_DOM.activeCardSelector);
  let best: HTMLElement | null = null;
  let bestTop = Infinity;
  for (const card of cards) {
    // Document order is chronological, so the first card at a given height wins ties
    const { top } = card.getBoundingClientRect();
    if (top < bestTop) {
      best = card;
      bestTop = top;
    }
  }
  return best;
}
