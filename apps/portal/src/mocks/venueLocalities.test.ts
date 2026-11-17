import { describe, expect, it } from 'vitest';
import { createSampleEvents, SAMPLE_LOCALITIES, toListings } from '@events/repo';
import { SAMPLE_VENUE_LOCALITIES } from './venueLocalities';

const LOCALITIES = new Map(SAMPLE_LOCALITIES.map((locality) => [locality.id, locality]));

describe('SAMPLE_VENUE_LOCALITIES', () => {
  it('gives every sample venue a Miejscowość of the same name from the dictionary', () => {
    const cities = new Set(toListings(createSampleEvents(new Date())).map(({ venue }) => venue.city));
    for (const city of cities) {
      expect(LOCALITIES.get(SAMPLE_VENUE_LOCALITIES[city])?.name, city).toBe(city);
    }
  });
});
