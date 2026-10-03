import 'server-only';

const DEFAULT_EVENTS_API_URL = 'http://api.events.local';

export const EVENTS_API_URL =
  process.env.EVENTS_API_URL || DEFAULT_EVENTS_API_URL;
