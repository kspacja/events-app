import type { DateRange } from '@events/time';
import type { OccurrenceListing } from './listing';

/**
 * Where the portal reads the programme from. Every adapter (HTTP, Catalog) promises:
 * (a) every occurrence whose event day (04:00 Europe/Warsaw boundary) lies in the inclusive range;
 * (b) sorted by startsAt, then occurrenceId;
 * (c) no duplicate occurrenceIds;
 * (d) any failure rejects with OccurrenceSourceError.
 * `describeOccurrenceSourceConformance` (`@events/contract/source/testing`) checks all four.
 */
export interface OccurrenceSource {
  listOccurrences(range: DateRange): Promise<OccurrenceListing[]>;
}

export class OccurrenceSourceError extends Error {
  constructor(options?: ErrorOptions) {
    super('The programme is temporarily unavailable.', options);
    this.name = 'OccurrenceSourceError';
  }
}

/** The ordering of promise (b), for adapters that have to sort. */
export function compareListings(a: OccurrenceListing, b: OccurrenceListing): number {
  const byTime = Date.parse(a.startsAt) - Date.parse(b.startsAt);
  if (byTime !== 0) return byTime;
  if (a.occurrenceId === b.occurrenceId) return 0;
  return a.occurrenceId < b.occurrenceId ? -1 : 1;
}
