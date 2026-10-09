import styles from './MonthCalendarSkeleton.module.css';

const CELLS = Array.from({ length: 42 }, (_, index) => index);

/** Same footprint as the month calendar (six weeks), so the page does not jump when it arrives. */
export function MonthCalendarSkeleton() {
  return (
    <div className={styles.calendar} aria-hidden="true">
      <div className={styles.toolbar} />
      <div className={styles.grid}>
        {CELLS.map((cell) => (
          <div key={cell} className={styles.cell} />
        ))}
      </div>
    </div>
  );
}
