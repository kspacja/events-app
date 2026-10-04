import 'server-only';

import { createInMemoryOccurrenceSource, createSampleCatalog } from '@events/catalog';
import type { OccurrenceSource } from '@events/contract/source';
import { getRuntimeConfig, type RuntimeConfig } from '@/config/runtimeConfig';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';

// Stage 1 adds the 'catalog' branch here
export function createOccurrenceSource(config: RuntimeConfig, now: Date): OccurrenceSource {
  switch (config.source) {
    case 'http':
      return createHttpOccurrenceSource(config.eventsApiUrl);
    case 'memory':
      return createInMemoryOccurrenceSource(createSampleCatalog(now));
  }
}

// The sample catalog is relative to `now`, so it is built per call; only the config is cached
export function getOccurrenceSource(now: Date = new Date()): OccurrenceSource {
  return createOccurrenceSource(getRuntimeConfig(), now);
}
