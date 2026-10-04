'use client';

import { STATE_LABELS } from '@/features/events/labels';
import styles from './page.module.css';

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className={styles.page}>
      <div role="alert" className={styles.status}>
        <p>{STATE_LABELS.error}</p>
        <button type="button" className={styles.retry} onClick={() => retry()}>
          {STATE_LABELS.retry}
        </button>
      </div>
    </main>
  );
}
