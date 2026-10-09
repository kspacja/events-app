'use client';

import { createContext, use, useState, type ReactNode } from 'react';

const NOT_MOCKED = Promise.resolve();
const MockingReadyContext = createContext<Promise<void>>(NOT_MOCKED);

// One worker per page load: React may run the state initialiser twice (Strict Mode), the worker must start once
let started: Promise<void> | undefined;

function startOnce(eventsApiUrl: string): Promise<void> {
  // Imported lazily, so the handlers and sample data stay out of the initial bundle
  started ??= import('./browser')
    .then(({ startBrowserMocking }) => startBrowserMocking(eventsApiUrl))
    .catch((error: unknown) => console.error('[events] MSW worker did not start', error));
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
  return <MockingReadyContext value={ready}>{children}</MockingReadyContext>;
}

/** Browser requests to the API await this, so none reaches the real URL before the MSW worker runs. */
export function useMockingReady(): Promise<void> {
  return use(MockingReadyContext);
}
