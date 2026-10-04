import type { DateRange } from '@/features/search/dateRange';
import type { OccurrenceListing } from '../types';

export interface OccurrenceSource {
  /** Accepts any range; returns each Occurrence once. */
  listOccurrences(range: DateRange): Promise<OccurrenceListing[]>;
}

export class OccurrenceSourceError extends Error {
  constructor() {
    super('The programme is temporarily unavailable.');
    this.name = 'OccurrenceSourceError';
  }
}
