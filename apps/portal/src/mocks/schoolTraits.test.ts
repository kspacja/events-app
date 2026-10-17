import { describe, expect, it } from 'vitest';
import { createSampleEvents } from '@events/repo';
import { SCHOOL_FILTERS } from '@/features/schools/schoolFilters';
import { SAMPLE_SCHOOL_TRAITS } from './schoolTraits';

const schoolEventIds = createSampleEvents(new Date())
  .events.filter(({ forSchools }) => forSchools)
  .map(({ id }) => id);

describe('sample school traits', () => {
  it.each(schoolEventIds)('%s has a known option for every filter', (id) => {
    const traits = SAMPLE_SCHOOL_TRAITS[id];
    for (const { param, options } of SCHOOL_FILTERS) {
      const known = options.map(({ value }) => value);
      expect(traits?.[param]?.length, `${id}: ${param}`).toBeGreaterThan(0);
      expect(traits[param].every((value) => known.includes(value)), `${id}: ${param}`).toBe(true);
    }
  });

  it('only describes school events', () => {
    expect(Object.keys(SAMPLE_SCHOOL_TRAITS).every((id) => schoolEventIds.includes(id as never))).toBe(true);
  });
});
