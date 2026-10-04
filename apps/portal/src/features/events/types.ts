import type { z } from 'zod';
import type { eventSchema, venueSchema } from '@events/contract/events';

export type Venue = z.infer<typeof venueSchema>;
export type Event = z.infer<typeof eventSchema>;
