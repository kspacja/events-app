'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import type { CalendarDay } from '@events/time';
import { CALENDAR_LABELS } from '../labels';
import { schoolsHref } from '../schoolsHref';
import { useFiltersQuery } from '../filtersQueryContext';
import { isPastWeek, shiftWeek } from '../weekShift';
import styles from './WeekArrow.module.css';

interface WeekArrowProps {
  readonly direction: -1 | 1;
  /** Monday of the shown week. */
  readonly week: CalendarDay;
  /** Takes over the click, so the page can react before the next week arrives. */
  readonly onNavigate?: (week: CalendarDay) => void;
  /** Only the sign, in a small filled square; the label stays for screen readers. */
  readonly compact?: boolean;
  /** With today, a week that has fully passed cannot be reached: the arrow is shown disabled. */
  readonly today?: CalendarDay;
}

/** Moves the shown week by one; the scroll position stays put. */
export function WeekArrow({ direction, week, onNavigate, compact = false, today }: WeekArrowProps) {
  const target = shiftWeek(week, direction);
  const filtersQuery = useFiltersQuery();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey;
    if (isModified || !onNavigate) return;
    event.preventDefault();
    onNavigate(target);
  }

  const sign = <span className={styles.sign} aria-hidden="true">{direction < 0 ? '‹' : '›'}</span>;
  const label = direction < 0 ? CALENDAR_LABELS.previousWeek : CALENDAR_LABELS.nextWeek;

  if (today && isPastWeek(target, today)) {
    return (
      <span className={`${compact ? styles.compact : styles.arrow} ${styles.disabled}`} aria-disabled="true">
        {sign}
        <span className={compact ? 'visually-hidden' : styles.label}>{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={schoolsHref(target, undefined, filtersQuery)}
      scroll={false}
      className={compact ? styles.compact : styles.arrow}
      onClick={handleClick}
    >
      {sign}
      <span className={compact ? 'visually-hidden' : styles.label}>{label}</span>
    </Link>
  );
}
