'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import type { CalendarDay } from '@events/time';
import { CALENDAR_LABELS } from '../labels';
import { schoolsHref } from '../schoolsHref';
import { shiftWeek } from '../weekShift';
import styles from './WeekArrow.module.css';

interface WeekArrowProps {
  readonly direction: -1 | 1;
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  /** Takes over the click, so the page can react before the next week arrives. */
  readonly onNavigate?: (week: CalendarDay) => void;
}

/** Moves the shown week by one; the scroll position stays put. */
export function WeekArrow({ direction, week, onNavigate }: WeekArrowProps) {
  const target = shiftWeek(week, direction);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey;
    if (isModified || !onNavigate) return;
    event.preventDefault();
    onNavigate(target);
  }

  return (
    <Link href={schoolsHref(target)} scroll={false} className={styles.arrow} onClick={handleClick}>
      <span aria-hidden="true">{direction < 0 ? '‹' : '›'}</span>
      <span className={styles.label}>{direction < 0 ? CALENDAR_LABELS.previousWeek : CALENDAR_LABELS.nextWeek}</span>
    </Link>
  );
}
