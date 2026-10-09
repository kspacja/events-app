import Link from 'next/link';
import type { CalendarDay } from '@events/time';
import { CALENDAR_LABELS } from '../labels';
import { schoolsHref } from '../schoolsHref';
import { shiftWeek } from '../weekShift';
import { LinkPending } from '@/features/events/components/LinkPending';
import styles from './WeekArrow.module.css';

interface WeekArrowProps {
  readonly direction: -1 | 1;
  /** Monday of the shown week. */
  readonly week: CalendarDay;
}

/** Moves the shown week by one; the scroll position stays put. */
export function WeekArrow({ direction, week }: WeekArrowProps) {
  return (
    <Link
      href={schoolsHref(shiftWeek(week, direction))}
      scroll={false}
      className={styles.arrow}
    >
      <span aria-hidden="true">{direction < 0 ? '‹' : '›'}</span>
      <span className={styles.label}>{direction < 0 ? CALENDAR_LABELS.previousWeek : CALENDAR_LABELS.nextWeek}</span>
      <LinkPending channels={['week']} />
    </Link>
  );
}
