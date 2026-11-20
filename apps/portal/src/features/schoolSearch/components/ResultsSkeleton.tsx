import { Skeleton } from '@/components/Skeleton';
import { STATE_LABELS } from '@/features/events/labels';
import styles from './SearchPage.module.css';

const ROWS = 5;

function Rows({ count }: { readonly count: number }) {
  return (
    <div className={styles.skeletonRows}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={96} radius="var(--radius-2xl)" />
      ))}
    </div>
  );
}

/** Search results and the organizer page while they load; `organizer` adds the right column. */
export function ResultsSkeleton({ organizer = false }: { readonly organizer?: boolean }) {
  return (
    <main className={styles.page} aria-busy="true">
      <p role="status" className="visually-hidden">
        {STATE_LABELS.loading}
      </p>
      <div className={styles.inner}>
        <Skeleton width={160} height={16} />
        <header className={styles.header}>
          <div className={styles.skeletonTitle}>
            <Skeleton width="70%" height={40} />
            <Skeleton width={120} height={18} />
          </div>
        </header>
        {organizer ? (
          <div className={styles.columns}>
            <Rows count={ROWS} />
            <div className={styles.asideStack}>
              <div className={styles.aside}>
                <Skeleton width={48} height={48} radius="var(--radius-full)" />
                <Skeleton />
                <Skeleton width="80%" />
              </div>
              <div className={styles.aside}>
                <Skeleton width="40%" />
                <Skeleton height={180} radius="var(--radius-lg)" />
              </div>
            </div>
          </div>
        ) : (
          <Rows count={ROWS} />
        )}
      </div>
    </main>
  );
}
