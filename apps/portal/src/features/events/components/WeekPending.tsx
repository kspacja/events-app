'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface WeekPendingValue {
  readonly pending: boolean;
  readonly setPending: (pending: boolean) => void;
}

// Without a scope the gate shows its children, so the strip also works outside a split layout
const WeekPendingContext = createContext<WeekPendingValue>({ pending: false, setPending: () => {} });

export function useWeekPendingSetter() {
  return useContext(WeekPendingContext).setPending;
}

/** Holds the "week is loading" state for the arrows and the strip under it. */
export function WeekPendingScope({ children }: { readonly children: ReactNode }) {
  const [pending, setPending] = useState(false);
  return <WeekPendingContext value={{ pending, setPending }}>{children}</WeekPendingContext>;
}

/** Shows `fallback` instead of the week while a week navigation is pending, since React keeps the old content on screen until the new one is ready. */
export function WeekPendingGate({ children, fallback }: { readonly children: ReactNode; readonly fallback: ReactNode }) {
  const { pending } = useContext(WeekPendingContext);
  return pending ? fallback : children;
}
