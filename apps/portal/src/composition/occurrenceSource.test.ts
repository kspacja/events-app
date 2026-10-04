import { describe, expect, it } from 'vitest';
import { SAMPLE_OCCURRENCES_IN_FIRST_WEEK } from '@events/catalog/testing';
import { addDays, currentEventDay, mondayOf, warsawIsoAt } from '@events/time';
import { createOccurrenceSource } from './occurrenceSource';

const NOON_MINUTES = 12 * 60;
const FIVE_WEEKS = 35;
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
    expect(await countInWeekOf(WEDNESDAY_NOON)).toBe(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
  });

  it('serves the week of the current event day just after midnight on Monday', async () => {
    expect(await countInWeekOf(MONDAY_AFTER_MIDNIGHT)).toBe(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
  });

  it('builds the sample catalog relative to the given date', async () => {
    const fiveWeeksLater = new Date(warsawIsoAt(addDays(currentEventDay(WEDNESDAY_NOON), FIVE_WEEKS), NOON_MINUTES));

    expect(await countInWeekOf(fiveWeeksLater)).toBe(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
  });
});
