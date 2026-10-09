import { describe, expect, it } from 'vitest';
import { currentEventDay, eventDayOf, isDayInRange, localMinutesOf, mondayOf, addDays, type DateRange } from '@events/time';
import type { EventsData } from './model';
import { toListings } from './listings';
import {
  createSampleEvents,
  SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK,
  SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK,
} from './sampleEvents';

// Wednesday noon, so the current week is Monday 2030-01-07 to Sunday 2030-01-13
const NOW = new Date('2030-01-09T12:00:00Z');
const FIRST_MONDAY = mondayOf('2030-01-09');
const WEEK = { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, 6) };
const WEEKS = 5;
const OCCURRENCES_IN_FIVE_WEEKS = 124;
const ALL_IN_FIRST_WEEK = SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK + SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK;

const listingsIn = (data: EventsData, range: DateRange) =>
  toListings(data).filter(({ startsAt }) => isDayInRange(eventDayOf(startsAt), range));

describe('createSampleEvents', () => {
  const data = createSampleEvents(NOW);

  it('holds the 8 Polish categories', () => {
    expect(data.categories.map(({ slug, label }) => `${slug}:${label}`)).toEqual([
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
    const ids = data.venues.map(({ id }) => id);
    const tumski = data.venues.filter(({ name }) => name === 'Ostrów Tumski');

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tumski.map(({ location }) => location.lat)).size).toBe(2);
  });

  it('is consistent: every reference resolves', () => {
    expect(() => toListings(data)).not.toThrow();
  });

  it('lists every event in the current week, one occurrence each', () => {
    const week = listingsIn(data, WEEK);

    expect(week).toHaveLength(ALL_IN_FIRST_WEEK);
    expect(new Set(week.map(({ event }) => event.id)).size).toBe(ALL_IN_FIRST_WEEK);
  });

  it('marks only the school events for schools', () => {
    const week = listingsIn(data, WEEK);

    expect(week.filter(({ event }) => event.forSchools)).toHaveLength(SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK);
    expect(week.filter(({ event }) => !event.forSchools)).toHaveLength(SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK);
  });

  it('has a day with at least 5 school events, for the "+n" day marker', () => {
    const perDay = new Map<string, number>();
    for (const { startsAt, event } of listingsIn(data, WEEK)) {
      if (event.forSchools) perDay.set(eventDayOf(startsAt), (perDay.get(eventDayOf(startsAt)) ?? 0) + 1);
    }

    expect(Math.max(...perDay.values())).toBeGreaterThanOrEqual(5);
  });

  it('skips some occurrences in later weeks across the 5 generated weeks', () => {
    const all = listingsIn(data, { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, WEEKS * 7 - 1) });

    expect(all).toHaveLength(OCCURRENCES_IN_FIVE_WEEKS);
  });

  it('puts the Sunday 01:30 stand-up on Saturday', () => {
    const night = listingsIn(data, WEEK).find(({ event }) => event.id === 'krk-latenight');

    if (!night) throw new Error('late-night stand-up missing from the week');
    expect(localMinutesOf(night.startsAt)).toBe(90);
    expect(eventDayOf(night.startsAt)).toBe('2030-01-12');
  });

  it('includes the week shown by the portal on Monday 00:30 Warsaw', () => {
    const mondayAfterMidnight = new Date('2030-01-13T23:30:00Z');
    const shownMonday = mondayOf(currentEventDay(mondayAfterMidnight));
    const shownWeek = { from: shownMonday, to: addDays(shownMonday, 6) };

    expect(shownMonday).toBe(FIRST_MONDAY);
    expect(listingsIn(createSampleEvents(mondayAfterMidnight), shownWeek)).toHaveLength(ALL_IN_FIRST_WEEK);
    expect(listingsIn(createSampleEvents(NOW), shownWeek)).toHaveLength(ALL_IN_FIRST_WEEK);
  });
});
