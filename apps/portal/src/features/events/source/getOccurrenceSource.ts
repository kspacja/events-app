import 'server-only';

import { createHttpOccurrenceSource } from './httpOccurrenceSource';
import type { OccurrenceSource } from './occurrenceSource';

// Stage 1 swaps in the Catalog adapter here
export function getOccurrenceSource(): OccurrenceSource {
  return createHttpOccurrenceSource();
}
