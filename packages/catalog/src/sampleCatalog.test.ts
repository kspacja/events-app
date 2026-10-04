import { describe, expect, it } from 'vitest';
import { currentEventDay, eventDayOf, localMinutesOf, mondayOf, addDays } from '@events/time';
import { createInMemoryOccurrenceSource } from './inMemoryOccurrenceSource';
import { listOccurrences } from './listOccurrences';
import { createSampleCatalog } from './sampleCatalog';

// Wednesday noon, so the current week is Monday 2030-01-07 to Sunday 2030-01-13
const NOW = new Date('2030-01-09T12:00:00Z');
const FIRST_MONDAY = mondayOf('2030-01-09');
const WEEK = { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, 6) };
const CARDS_IN_FIRST_WEEK = 22;
const WEEKS = 5;
const OCCURRENCES_IN_FIVE_WEEKS = 88;

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
    expect(() => listOccurrences(catalog, { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, 40) })).not.toThrow();
  });

  it('lists every event in the current week, one occurrence each', () => {
    const week = listOccurrences(catalog, WEEK);

    expect(week).toHaveLength(CARDS_IN_FIRST_WEEK);
    expect(week[0].occurrenceId).toBe('wro-choir-2030-01-07');
  });

  it('skips some occurrences in later weeks across the 5 generated weeks', () => {
    const all = listOccurrences(catalog, { from: FIRST_MONDAY, to: addDays(FIRST_MONDAY, WEEKS * 7 - 1) });

    expect(all).toHaveLength(OCCURRENCES_IN_FIVE_WEEKS);
  });

  it('puts the Sunday 01:30 stand-up on Saturday', () => {
    const night = listOccurrences(catalog, WEEK).find(({ event }) => event.id === 'krk-latenight');

    if (!night) throw new Error('late-night stand-up missing from the week');
    expect(localMinutesOf(night.startsAt)).toBe(90);
    expect(eventDayOf(night.startsAt)).toBe('2030-01-12');
  });

  it('is served through the in-memory source unchanged', async () => {
    const listed = await createInMemoryOccurrenceSource(catalog).listOccurrences(WEEK);

    expect(listed).toEqual(listOccurrences(catalog, WEEK));
  });

  it('includes the week shown by the portal on Monday 00:30 Warsaw', () => {
    const mondayAfterMidnight = new Date('2030-01-13T23:30:00Z');
    const shownMonday = mondayOf(currentEventDay(mondayAfterMidnight));
    const shownWeek = { from: shownMonday, to: addDays(shownMonday, 6) };

    expect(shownMonday).toBe(FIRST_MONDAY);
    expect(listOccurrences(createSampleCatalog(mondayAfterMidnight), shownWeek)).toHaveLength(CARDS_IN_FIRST_WEEK);
    expect(listOccurrences(createSampleCatalog(NOW), shownWeek)).toHaveLength(CARDS_IN_FIRST_WEEK);
  });
});
