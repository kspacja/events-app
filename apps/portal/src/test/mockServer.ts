import { createMockServer } from '@/mocks/node';

export const TEST_EVENTS_API_URL = 'http://api.events.test';

export const server = createMockServer(TEST_EVENTS_API_URL);
