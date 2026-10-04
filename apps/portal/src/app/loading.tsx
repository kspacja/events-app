import { STATE_LABELS } from '@/features/events/labels';
import styles from './page.module.css';

export default function Loading() {
  return (
    <main className={styles.page}>
      <p role="status" className={styles.status}>
        {STATE_LABELS.loading}
      </p>
    </main>
  );
}
