import type { Catalog } from './model';

/** Test-only: a Catalog whose occurrences are unreadable, standing in for a failing backend. */
export function brokenCatalog(base: Catalog): Catalog {
  return Object.create(base, {
    occurrences: {
      get() {
        throw new Error('backend down');
      },
    },
  });
}
