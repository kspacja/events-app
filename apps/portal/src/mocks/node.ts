import { setupServer } from 'msw/node';
import { createHandlers } from './handlers';

export function createMockServer(eventsApiUrl: string) {
  return setupServer(...createHandlers(eventsApiUrl));
}
