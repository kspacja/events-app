'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { CalendarDay } from '@events/time';
import type { ScheduleLanding } from '../schedule';
import { dayDomId, occurrenceDomId } from '../scheduleDom';

const PAGE_SCROLL_MARGIN = 24;
const DAY_HASH_PREFIX = 'day-';

/** Scrolls only the strip sideways to a day, never the page. */
export function scrollStripToDay(day: CalendarDay, behavior: ScrollBehavior) {
  const column = document.getElementById(dayDomId(day));
  const strip = column?.closest<HTMLElement>('[data-day-strip]');
  if (!column || !strip) return;

  const padding = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
  strip.scrollTo({ left: column.offsetLeft - padding, behavior });
}

/** A day jump to another week carries its day in the hash; read it once and drop it from the URL. */
function takeDayFromHash(): CalendarDay | null {
  const id = window.location.hash.slice(1);
  if (!id.startsWith(DAY_HASH_PREFIX)) return null;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return id.slice(DAY_HASH_PREFIX.length) as CalendarDay;
}

interface DayStripProps {
  readonly className: string;
  readonly landing: ScheduleLanding;
  readonly children: ReactNode;
}

export function DayStrip({ className, landing, children }: DayStripProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { occurrenceId } = landing;
    const strip = ref.current;
    const column = document.getElementById(dayDomId(takeDayFromHash() ?? landing.day));
    if (!strip || !column) return;

    const padding = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
    strip.scrollLeft = column.offsetLeft - padding;

    const card = occurrenceId ? document.getElementById(occurrenceDomId(occurrenceId)) : null;
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - PAGE_SCROLL_MARGIN;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  // A new landing object arrives with every server navigation, so range or time changes re-scroll
  }, [landing]);

  return (
    <div ref={ref} className={className} data-day-strip>
      {children}
    </div>
  );
}
