import { describe, expect, it } from 'vitest';
import { localDayOf, mondayOf, addDays } from '@events/time';
import { createOccurrenceSource } from './occurrenceSource';

describe('createOccurrenceSource', () => {
  it('serves the sample catalog for the memory source', async () => {
    const monday = mondayOf(localDayOf(new Date()));
    const source = createOccurrenceSource({ source: 'memory' });

    const listings = await source.listOccurrences({ from: monday, to: addDays(monday, 6) });

    expect(listings).toHaveLength(22);
  });
});
