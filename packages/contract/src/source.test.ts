import { describe, expect, it } from 'vitest';
import { isDayInRange, eventDayOf } from '@events/time';
import type { OccurrenceListing } from './listing';
import {
  compareListings,
  OccurrenceSourceError,
  type OccurrenceSource,
} from './source';
import { describeOccurrenceSourceConformance } from './sourceConformance';

describeOccurrenceSourceConformance('in-memory reference source', () => {
  let store: readonly OccurrenceListing[] = [];
  let broken = false;

  const source: OccurrenceSource = {
    listOccurrences(range) {
      if (broken) return Promise.reject(new OccurrenceSourceError());
      return Promise.resolve(
        store
          .filter(({ startsAt }) => isDayInRange(eventDayOf(startsAt), range))
          .sort(compareListings),
      );
    },
  };

  return {
    source,
    seed: (listings) => {
      store = listings;
    },
    breakBackend: () => {
      broken = true;
    },
  };
});

describe('OccurrenceSourceError', () => {
  it('carries the original failure as its cause', () => {
    const cause = new Error('boom');

    expect(new OccurrenceSourceError({ cause }).cause).toBe(cause);
  });
});
