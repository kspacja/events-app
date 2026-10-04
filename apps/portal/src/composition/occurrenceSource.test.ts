import { describe, expect, it } from 'vitest';
import { addDays, localDayOf, mondayOf } from '@events/time';
import { createOccurrenceSource } from './occurrenceSource';

const CARDS_IN_CURRENT_WEEK = 22;

async function countInWeekOf(now: Date) {
  const monday = mondayOf(localDayOf(now));
  const source = createOccurrenceSource({ source: 'memory' }, now);
  const listings = await source.listOccurrences({ from: monday, to: addDays(monday, 6) });
  return listings.length;
}

describe('createOccurrenceSource', () => {
  it('serves the sample catalog for the memory source', async () => {
    expect(await countInWeekOf(new Date())).toBe(CARDS_IN_CURRENT_WEEK);
  });

  it('builds the sample catalog relative to the given date', async () => {
    const fiveWeeksLater = addDays(localDayOf(new Date()), 35);

    expect(await countInWeekOf(new Date(`${fiveWeeksLater}T12:00:00`))).toBe(CARDS_IN_CURRENT_WEEK);
  });
});
