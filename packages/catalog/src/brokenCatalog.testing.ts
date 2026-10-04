import type { Catalog } from './model';

/** Test-only: a Catalog whose occurrences are unreadable, standing in for a failing backend. */
export function brokenCatalog(base: Catalog): Catalog {
  return new Proxy(base, {
    get(target, property, receiver) {
      if (property === 'occurrences') throw new Error('backend down');
      return Reflect.get(target, property, receiver);
    },
  });
}
