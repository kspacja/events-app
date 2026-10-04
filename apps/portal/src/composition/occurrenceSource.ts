import 'server-only';

import { createInMemoryOccurrenceSource, createSampleCatalog } from '@events/catalog';
import type { OccurrenceSource } from '@events/contract/source';
import { getRuntimeConfig, type RuntimeConfig } from '@/config/runtimeConfig';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';

// Stage 1 adds the 'catalog' branch here
export function createOccurrenceSource(config: RuntimeConfig): OccurrenceSource {
  switch (config.source) {
    case 'http':
      return createHttpOccurrenceSource(config.eventsApiUrl);
    case 'memory':
      return createInMemoryOccurrenceSource(createSampleCatalog(new Date()));
  }
}

let cached: OccurrenceSource | undefined;

export function getOccurrenceSource(): OccurrenceSource {
  cached ??= createOccurrenceSource(getRuntimeConfig());
  return cached;
}
