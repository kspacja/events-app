import { describe, expect, it } from 'vitest';
import { currentEventDay, eventDayOf, isDayInRange, localMinutesOf, mondayOf, addDays } from '@events/time';
import type { DateRange } from '@events/time';
import type { Catalog } from './model';
import { toListings } from './listings';
import { createSampleCatalog, SAMPLE_OCCURRENCES_IN_FIRST_WEEK } from './sampleCatalog';

// Wednesday noon, so the current week is Monday 2030-01-07 to Sunday 2030-01-13
const NOW = new Date('2030-01-09T12:00:00Z');
const FIRST_MONDAY = mondayOf('2030-01-09');
const WEEK = { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, 6) };
const WEEKS = 5;
const OCCURRENCES_IN_FIVE_WEEKS = 88;

const listingsIn = (catalog: Catalog, range: DateRange) =>
  toListings(catalog).filter(({ startsAt }) => isDayInRange(eventDayOf(startsAt), range));

describe('createSampleCatalog', () => {
  const catalog = createSampleCatalog(NOW);

  it('holds the 8 Polish categories', () => {
    expect(catalog.categories.map(({ slug, label }) => `${slug}:${label}`)).toEqual([
      'music:Muzyka',
      'film:Film',
      'food:Jedzenie',
      'movement:Ruch',
      'workshops:Warsztaty',
      'art:Sztuka',
      'meetups:Spotkania',
      'comedy:Komedia',
    ]);
  });

  it('identifies venues by id, so places may share a name', () => {
    const ids = catalog.venues.map(({ id }) => id);
    const tumski = catalog.venues.filter(({ name }) => name === 'Ostrów Tumski');

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tumski.map(({ location }) => location.lat)).size).toBe(2);
  });

  it('is consistent: every reference resolves', () => {
    expect(() => toListings(catalog)).not.toThrow();
  });

  it('lists every event in the current week, one occurrence each', () => {
    const week = listingsIn(catalog, WEEK);

    expect(week).toHaveLength(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
    expect(new Set(week.map(({ event }) => event.id)).size).toBe(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
  });

  it('skips some occurrences in later weeks across the 5 generated weeks', () => {
    const all = listingsIn(catalog, { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, WEEKS * 7 - 1) });

    expect(all).toHaveLength(OCCURRENCES_IN_FIVE_WEEKS);
  });

  it('puts the Sunday 01:30 stand-up on Saturday', () => {
    const night = listingsIn(catalog, WEEK).find(({ event }) => event.id === 'krk-latenight');

    if (!night) throw new Error('late-night stand-up missing from the week');
    expect(localMinutesOf(night.startsAt)).toBe(90);
    expect(eventDayOf(night.startsAt)).toBe('2030-01-12');
  });

  it('includes the week shown by the portal on Monday 00:30 Warsaw', () => {
    const mondayAfterMidnight = new Date('2030-01-13T23:30:00Z');
    const shownMonday = mondayOf(currentEventDay(mondayAfterMidnight));
    const shownWeek = { from: shownMonday, to: addDays(shownMonday, 6) };

    expect(shownMonday).toBe(FIRST_MONDAY);
    expect(listingsIn(createSampleCatalog(mondayAfterMidnight), shownWeek)).toHaveLength(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
    expect(listingsIn(createSampleCatalog(NOW), shownWeek)).toHaveLength(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
  });
});
