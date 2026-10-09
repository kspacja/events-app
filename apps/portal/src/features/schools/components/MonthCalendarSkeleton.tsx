import styles from './MonthCalendarSkeleton.module.css';

interface MonthGridSkeletonProps {
  /** The rows the shown month has, so the grid keeps its height while the next month loads. */
  readonly rows: number;
}

export function MonthGridSkeleton({ rows }: MonthGridSkeletonProps) {
  const cells = Array.from({ length: rows * 7 }, (_, index) => index);
  return (
    <div className={styles.grid} aria-hidden="true">
      {cells.map((cell) => (
        <div key={cell} className={styles.cell} />
      ))}
    </div>
  );
}

export function MonthCalendarSkeleton() {
  return (
    <div className={styles.calendar} aria-hidden="true">
      <div className={styles.toolbar} />
      <MonthGridSkeleton rows={6} />
    </div>
  );
}
