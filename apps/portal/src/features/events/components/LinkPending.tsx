'use client';

import { useEffect } from 'react';
import { useLinkStatus } from 'next/link';
import { usePendingSetter, type PendingChannel } from './PendingScope';
import styles from './LinkPending.module.css';

interface LinkPendingProps {
  readonly channels: readonly PendingChannel[];
  readonly showDot?: boolean;
}

/** Reports the link's navigation to the scope, and optionally shows a dot while it runs. */
export function LinkPending({ channels, showDot = true }: LinkPendingProps) {
  const { pending } = useLinkStatus();
  const setPending = usePendingSetter();
  const channelKey = channels.join(',');

  useEffect(() => {
    const names = channelKey.split(',') as PendingChannel[];
    for (const channel of names) setPending(channel, pending);
    return () => {
      for (const channel of names) setPending(channel, false);
    };
  }, [channelKey, pending, setPending]);

  if (!showDot) return null;
  return <span className={styles.dot} data-pending={pending || undefined} aria-hidden="true" />;
}
