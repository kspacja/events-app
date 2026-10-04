import { OccurrenceSourceError, type OccurrenceSource } from '@events/contract/source';
import { listOccurrences } from './listOccurrences';
import type { Catalog } from './model';

export function createInMemoryOccurrenceSource(catalog: Catalog): OccurrenceSource {
  return {
    async listOccurrences(range) {
      try {
        return listOccurrences(catalog, range);
      } catch (error) {
        throw new OccurrenceSourceError({ cause: error });
      }
    },
  };
}
