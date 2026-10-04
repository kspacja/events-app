import { describe, expect, it } from 'vitest';
import { describeOccurrenceSourceConformance } from '@events/contract/source/testing';
import { OccurrenceSourceError, type OccurrenceSource } from '@events/contract/source';
import { brokenCatalog } from './brokenCatalog.testing';
import { catalogFromListings } from './catalogFromListings';
import { createInMemoryOccurrenceSource } from './inMemoryOccurrenceSource';
import { listOccurrences } from './listOccurrences';
import { createSampleCatalog } from './sampleCatalog';

const RANGE = { from: '2030-01-01', to: '2030-01-31' } as const;

describeOccurrenceSourceConformance('In-memory occurrence source', () => {
  let current: OccurrenceSource = createInMemoryOccurrenceSource(catalogFromListings([]));
  return {
    source: { listOccurrences: (range) => current.listOccurrences(range) },
    seed: (listings) => {
      current = createInMemoryOccurrenceSource(catalogFromListings(listings));
    },
    breakBackend: () => {
      current = createInMemoryOccurrenceSource(brokenCatalog(createSampleCatalog(new Date('2030-03-30T12:00:00Z'))));
    },
  };
});

describe('createInMemoryOccurrenceSource', () => {
  it('serves the projection of the sample catalog', async () => {
    const catalog = createSampleCatalog(new Date('2030-01-01T12:00:00Z'));

    const listed = await createInMemoryOccurrenceSource(catalog).listOccurrences(RANGE);

    expect(listed).toEqual(listOccurrences(catalog, RANGE));
  });

  it('keeps the original failure as the cause', async () => {
    const catalog = createSampleCatalog(new Date('2030-01-01T12:00:00Z'));
    const broken = createInMemoryOccurrenceSource(brokenCatalog(catalog));

    const failure = await broken.listOccurrences(RANGE).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(OccurrenceSourceError);
    expect(failure).toMatchObject({ cause: expect.any(Error) });
  });
});
