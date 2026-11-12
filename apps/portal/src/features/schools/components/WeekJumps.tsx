'use client';

import { MONTH_LABELS } from '../labels';
import type { WeekJump } from '../monthWeeks';
import styles from './MonthDock.module.css';

/** Phones: the month's weeks in the dock; a week scrolls the list to its first day with events. */
export function WeekJumps({ jumps }: { readonly jumps: readonly WeekJump[] }) {
  return (
    <nav className={styles.jumps} aria-label={MONTH_LABELS.weekJumps}>
      {jumps.map(({ label, target }) => (
        <button
          key={label}
          type="button"
          className={styles.jump}
          disabled={!target}
          onClick={() => {
            const day = target && document.querySelector<HTMLElement>(`[data-day="${target}"]`);
            if (!day) return;
            const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
            day.scrollIntoView({ block: 'start', behavior });
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
