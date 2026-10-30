'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { addDays, type CalendarDay } from '@events/time';
import { scrollStripToDay } from './DayStrip';

interface DayJumpProps {
  readonly day: CalendarDay;
  /** Monday of the week on screen; a day inside it is scrolled to, not navigated to. Without it every day is on the page. */
  readonly shownWeek?: CalendarDay;
  readonly href: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-current'?: 'date';
  /** Takes over a jump to another week, so the page can react before that week arrives. */
  readonly onNavigate?: () => void;
  readonly children: ReactNode;
}

function isInWeek(day: CalendarDay, week: CalendarDay): boolean {
  return day >= week && day < addDays(week, 7);
}

export function DayJump({ day, shownWeek, href, onNavigate, children, ...props }: DayJumpProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey;
    if (isModified) return;
    if (shownWeek && !isInWeek(day, shownWeek)) {
      if (!onNavigate) return;
      event.preventDefault();
      onNavigate();
      return;
    }
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollStripToDay(day, reduceMotion ? 'auto' : 'smooth');
  }

  return (
    <Link href={href} scroll={false} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
