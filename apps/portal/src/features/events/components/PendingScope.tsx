'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type PendingChannel = 'week' | 'month';

type PendingState = Record<PendingChannel, boolean>;

interface PendingValue {
  readonly pending: PendingState;
  readonly setPending: (channel: PendingChannel, pending: boolean) => void;
}

const IDLE: PendingState = { week: false, month: false };

// Without a scope the gates show their children, so the parts also work outside a split layout
const PendingContext = createContext<PendingValue>({ pending: IDLE, setPending: () => {} });

export function usePendingSetter() {
  return useContext(PendingContext).setPending;
}

/** Holds the "loading" state of the week and the month, so links anywhere inside can switch parts to their skeletons. */
export function PendingScope({ children }: { readonly children: ReactNode }) {
  const [pending, setPendingState] = useState(IDLE);
  const setPending = useCallback(
    (channel: PendingChannel, value: boolean) =>
      setPendingState((state) => (state[channel] === value ? state : { ...state, [channel]: value })),
    [],
  );
  const value = useMemo(() => ({ pending, setPending }), [pending, setPending]);
  return <PendingContext value={value}>{children}</PendingContext>;
}

/** Shows `fallback` instead of `children` while the channel is pending, since React keeps the old content on screen until the new one is ready. */
export function PendingGate({
  channel,
  children,
  fallback,
}: {
  readonly channel: PendingChannel;
  readonly children: ReactNode;
  readonly fallback: ReactNode;
}) {
  const { pending } = useContext(PendingContext);
  return pending[channel] ? fallback : children;
}
