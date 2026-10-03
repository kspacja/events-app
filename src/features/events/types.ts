import type { z } from 'zod';
import type {
  eventCategorySchema,
  eventSchema,
  venueSchema,
} from './contract';

export type EventCategory = z.infer<typeof eventCategorySchema>;
export type Venue = z.infer<typeof venueSchema>;
export type Event = z.infer<typeof eventSchema>;
