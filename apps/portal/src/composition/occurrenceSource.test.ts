import { describe, expect, it } from 'vitest';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { createOccurrenceSource } from './occurrenceSource';

const CARDS_IN_CURRENT_WEEK = 22;
const WEDNESDAY_NOON = new Date('2026-10-07T12:00:00+02:00');
const MONDAY_AFTER_MIDNIGHT = new Date('2026-10-12T00:30:00+02:00');

async function countInWeekOf(now: Date) {
  const monday = mondayOf(currentEventDay(now));
  const source = createOccurrenceSource({ source: 'memory' }, now);
  const listings = await source.listOccurrences({ from: monday, to: addDays(monday, 6) });
  return listings.length;
}

describe('createOccurrenceSource', () => {
  it('serves the sample catalog for the memory source', async () => {
    expect(await countInWeekOf(WEDNESDAY_NOON)).toBe(CARDS_IN_CURRENT_WEEK);
  });

  it('serves the week of the current event day just after midnight on Monday', async () => {
    expect(await countInWeekOf(MONDAY_AFTER_MIDNIGHT)).toBe(CARDS_IN_CURRENT_WEEK);
  });

  it('builds the sample catalog relative to the given date', async () => {
    const fiveWeeksLater = new Date(WEDNESDAY_NOON.getTime() + 35 * 24 * 60 * 60 * 1000);

    expect(await countInWeekOf(fiveWeeksLater)).toBe(CARDS_IN_CURRENT_WEEK);
  });
});
