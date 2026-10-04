import { describe, expect, it } from 'vitest';
import { eventDayOf, localMinutesOf, mondayOf, addDays } from '@events/time';
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

  it('has one Venue per place, so no name repeats within a city', () => {
    const places = catalog.venues.map(({ name, city }) => `${city}/${name}`);

    expect(new Set(places).size).toBe(places.length);
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

    expect(night && localMinutesOf(night.startsAt)).toBe(90);
    expect(night && eventDayOf(night.startsAt)).toBe('2030-01-12');
  });

  it('is served through the in-memory source unchanged', async () => {
    const listed = await createInMemoryOccurrenceSource(catalog).listOccurrences(WEEK);

    expect(listed).toEqual(listOccurrences(catalog, WEEK));
  });
});
