import 'server-only';

import type { ReactNode } from 'react';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { MockingProvider } from './MockingProvider';

/** Wraps pages that fetch in the browser: passes the server's runtime config down, no NEXT_PUBLIC_ build-time copy. */
export function BrowserMocking({ children }: { readonly children: ReactNode }) {
  const { eventsApiUrl, mocking } = getRuntimeConfig();
  return (
    <MockingProvider enabled={mocking} eventsApiUrl={eventsApiUrl}>
      {children}
    </MockingProvider>
  );
}
