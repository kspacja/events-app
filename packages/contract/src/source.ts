import type { DateRange } from '@events/time';
import type { OccurrenceListing } from './listing';

/** Where the portal reads the programme from: occurrences whose event day lies in the range, sorted by `compareListings`. */
export interface OccurrenceSource {
  listOccurrences(range: DateRange): Promise<OccurrenceListing[]>;
}

export class OccurrenceSourceError extends Error {
  constructor(options?: ErrorOptions) {
    super('The programme is temporarily unavailable.', options);
    this.name = 'OccurrenceSourceError';
  }
}

/** By startsAt, then occurrenceId. */
export function compareListings(a: OccurrenceListing, b: OccurrenceListing): number {
  const byTime = Date.parse(a.startsAt) - Date.parse(b.startsAt);
  if (byTime !== 0) return byTime;
  if (a.occurrenceId === b.occurrenceId) return 0;
  return a.occurrenceId < b.occurrenceId ? -1 : 1;
}
