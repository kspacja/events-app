import { TopBar } from '@/features/events/components/TopBar';
import { STATE_LABELS } from '@/features/events/labels';
import styles from './page.module.css';

export default function Loading() {
  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <p role="status" className={styles.status}>
          {STATE_LABELS.loading}
        </p>
      </main>
    </>
  );
}
