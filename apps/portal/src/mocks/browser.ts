import { setupWorker } from 'msw/browser';
import { createHandlers } from './handlers';

export async function startBrowserMocking(eventsApiUrl: string): Promise<void> {
  await setupWorker(...createHandlers(eventsApiUrl)).start({ onUnhandledFrame: 'bypass', quiet: true });
}
