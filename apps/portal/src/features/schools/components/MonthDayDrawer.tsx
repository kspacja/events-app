'use client';

import { useEffect, useId, useRef } from 'react';
import type { CalendarDay } from '@events/time';
import type { OccurrenceListing } from '@events/contract/listing';
import { OccurrenceCard } from '@/features/events/components/OccurrenceCard';
import { formatDay } from '@/lib/format';
import { MONTH_LABELS } from '../labels';
import styles from './MonthDayDrawer.module.css';

interface MonthDayDrawerProps {
  readonly day: CalendarDay;
  readonly listings: readonly OccurrenceListing[];
  /** The side away from the day, so the day stays in sight. */
  readonly side: 'start' | 'end';
  readonly onClose: () => void;
}

/** Not modal: the month stays usable beside it, and another day's "+N" swaps its content. */
export function MonthDayDrawer({ day, listings, side, onClose }: MonthDayDrawerProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [day]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <aside role="dialog" aria-modal="false" aria-labelledby={headingId} className={styles.drawer} data-side={side}>
      <div className={styles.bar}>
        <h3 id={headingId} ref={headingRef} tabIndex={-1} className={styles.heading}>
          {formatDay(day, 'EEEE, d MMMM')}
        </h3>
        <button type="button" className={styles.close} onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="visually-hidden">{MONTH_LABELS.closeDay}</span>
        </button>
      </div>
      <ul className={styles.list}>
        {listings.map((listing) => (
          <li key={listing.occurrenceId}>
            <OccurrenceCard listing={listing} variant="popup" />
          </li>
        ))}
      </ul>
    </aside>
  );
}
