import type { z } from 'zod';
import type {
  occurrenceListingSchema,
  priceSchema,
  venueSchema,
} from '@events/contract/occurrences';

export type OccurrenceListing = z.infer<typeof occurrenceListingSchema>;
export type Venue = z.infer<typeof venueSchema>;
export type Price = z.infer<typeof priceSchema>;
