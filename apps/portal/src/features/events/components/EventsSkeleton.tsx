import { STATE_LABELS } from '../labels';
import styles from './EventsSkeleton.module.css';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Shown while the week's listings load: the same split as the section, with empty blocks where the calendar, arrows and days go. */
export function EventsSkeleton() {
  return (
    <div className={styles.skeleton} role="status">
      <span className="visually-hidden">{STATE_LABELS.loading}</span>
      <div className={styles.split} aria-hidden="true">
        <div className={styles.left}>
          <div className={styles.calendar} />
        </div>
        <div className={styles.right}>
          <div className={styles.arrows} />
          <div className={styles.strip}>
            {DAYS.map((day) => (
              <div key={day} className={styles.day} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
