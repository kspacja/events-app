'use client';

import { useEffect } from 'react';
import { useLinkStatus } from 'next/link';
import { useWeekPendingSetter } from '@/features/events/components/WeekPending';
import styles from './LinkPending.module.css';

/** A fixed-size dot that shows while the link around it navigates, and tells the week strip to show its skeleton. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  const setPending = useWeekPendingSetter();
  useEffect(() => {
    setPending(pending);
    return () => setPending(false);
  }, [pending, setPending]);
  return <span className={styles.dot} data-pending={pending || undefined} aria-hidden="true" />;
}
