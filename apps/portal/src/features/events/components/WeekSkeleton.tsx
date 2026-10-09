import { STATE_LABELS } from '../labels';
import styles from './WeekSkeleton.module.css';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export function StripSkeleton() {
  return (
    <div className={styles.strip} role="status">
      <span className="visually-hidden">{STATE_LABELS.loading}</span>
      {DAYS.map((day) => (
        <div key={day} className={styles.day} aria-hidden="true" />
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return <div className={styles.map} aria-hidden="true" />;
}
