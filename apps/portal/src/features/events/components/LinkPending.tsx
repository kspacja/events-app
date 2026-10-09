'use client';

import { useLinkStatus } from 'next/link';
import styles from './LinkPending.module.css';

/** A fixed-size dot that shows while the link around it navigates. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return <span className={styles.dot} data-pending={pending || undefined} aria-hidden="true" />;
}
