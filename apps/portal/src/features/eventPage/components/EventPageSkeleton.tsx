import { Skeleton } from '@/components/Skeleton';
import { STATE_LABELS } from '@/features/events/labels';
import styles from './EventPage.module.css';

/** The event page's layout while it loads: same columns, blocks instead of content. */
export function EventPageSkeleton() {
  return (
    <main className={styles.page} aria-busy="true">
      <p role="status" className="visually-hidden">
        {STATE_LABELS.loading}
      </p>
      <div className={styles.inner}>
        <Skeleton width={320} height={14} />
        <div className={styles.layout} style={{ marginTop: 'var(--space-4)' }}>
          <div className={styles.header}>
            <Skeleton width="60%" height={36} />
            <Skeleton width={260} height={32} radius="var(--radius-full)" className={styles.skeletonGap} />
            <Skeleton width="45%" height={28} radius="var(--radius-full)" className={styles.skeletonGap} />
          </div>
          <div className={styles.galleryArea}>
            <Skeleton aspectRatio="3 / 2" radius="var(--radius-2xl)" />
          </div>
          <div className={styles.aside}>
            <div className={styles.card}>
              <Skeleton width="50%" />
              <Skeleton width="80%" height={22} />
              <Skeleton width="40%" />
              <Skeleton width="60%" />
              <Skeleton height={44} radius="var(--radius-lg)" />
              <Skeleton height={44} radius="var(--radius-lg)" />
            </div>
            <div className={styles.card}>
              <Skeleton width="40%" />
              <Skeleton height={180} radius="var(--radius-lg)" />
              <Skeleton width="70%" />
            </div>
          </div>
          <div className={styles.body}>
            <Skeleton />
            <Skeleton />
            <Skeleton width="75%" />
          </div>
        </div>
      </div>
    </main>
  );
}
