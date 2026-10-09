'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const NOT_MOCKED = Promise.resolve();
const MockingReadyContext = createContext<Promise<void>>(NOT_MOCKED);

// One worker per page load: React may run the state initialiser twice (Strict Mode), the worker must start once
let started: Promise<void> | undefined;

function startOnce(eventsApiUrl: string): Promise<void> {
  // Imported lazily, so the handlers and sample data stay out of the bundle unless mocking is on
  started ??= import('./browser').then(({ startBrowserMocking }) => startBrowserMocking(eventsApiUrl));
  return started;
}

interface MockingProviderProps {
  readonly enabled: boolean;
  readonly eventsApiUrl: string;
  readonly children: ReactNode;
}

export function MockingProvider({ enabled, eventsApiUrl, children }: MockingProviderProps) {
  const [ready] = useState(() =>
    enabled && typeof window !== 'undefined' ? startOnce(eventsApiUrl) : NOT_MOCKED,
  );
  return <MockingReadyContext.Provider value={ready}>{children}</MockingReadyContext.Provider>;
}

/** Browser requests await this, so none reaches the real URL before the MSW worker runs. */
export function useMockingReady(): Promise<void> {
  return useContext(MockingReadyContext);
}
