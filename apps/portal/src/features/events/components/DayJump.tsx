'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { addDays, type CalendarDay } from '@events/time';
import { scrollStripToDay } from './DayStrip';
import { LinkPending } from './LinkPending';

interface DayJumpProps {
  readonly day: CalendarDay;
  /** Monday of the week on screen; a day inside it is scrolled to, not navigated to. */
  readonly shownWeek: CalendarDay;
  readonly href: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-current'?: 'date';
  readonly children: ReactNode;
}

function isInWeek(day: CalendarDay, week: CalendarDay): boolean {
  return day >= week && day < addDays(week, 7);
}

export function DayJump({ day, shownWeek, href, children, ...props }: DayJumpProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey;
    if (isModified || !isInWeek(day, shownWeek)) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollStripToDay(day, reduceMotion ? 'auto' : 'smooth');
  }

  return (
    <Link href={href} scroll={false} onClick={handleClick} {...props}>
      {children}
      <LinkPending channels={['week']} showDot={false} />
    </Link>
  );
}
