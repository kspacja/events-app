'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { ScheduleLanding } from '../schedule';
import { dayDomId, occurrenceDomId } from '../scheduleDom';

const PAGE_SCROLL_MARGIN = 24;

interface DayStripProps {
  readonly className: string;
  readonly landing: ScheduleLanding;
  readonly children: ReactNode;
}

export function DayStrip({ className, landing, children }: DayStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { day, occurrenceId } = landing;

  useEffect(() => {
    const strip = ref.current;
    const column = document.getElementById(dayDomId(day));
    if (!strip || !column) return;

    const padding = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
    strip.scrollLeft = column.offsetLeft - padding;

    const card = occurrenceId ? document.getElementById(occurrenceDomId(occurrenceId)) : null;
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - PAGE_SCROLL_MARGIN;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [day, occurrenceId]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
