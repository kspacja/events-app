import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { appBoundaries, DEPENDENCY_MAP, packageBoundaries } from './index.mjs';

const linter = new Linter({ configType: 'flat' });

function messagesFor(configs, code, filename = 'src/file.js') {
  return linter.verify(code, configs, { filename }).map(({ message }) => message);
}

const importing = (source) => `import x from '${source}';\nexport { x };\n`;
const catalog = packageBoundaries('catalog');
const time = packageBoundaries('time');
const portal = appBoundaries('portal');

describe('dependency map', () => {
  it('lets a package import what the map allows', () => {
    expect(messagesFor(catalog, importing('@events/contract'))).toEqual([]);
    expect(messagesFor(catalog, importing('@events/time'))).toEqual([]);
  });

  it('keeps the subpaths of an allowed package allowed', () => {
    expect(messagesFor(catalog, importing('@events/contract/listing'))).toEqual([]);
  });

  it('rejects a mapped package that is not allowed', () => {
    expect(messagesFor(time, importing('@events/contract'))).toEqual([
      expect.stringContaining('time may import only: time'),
    ]);
  });

  it('rejects an unknown @events package', () => {
    expect(messagesFor(catalog, importing('@events/unknown'))).toHaveLength(1);
    expect(messagesFor(portal, importing('@events/unknown'))).toHaveLength(1);
  });

  it('lets an app import every package in the map', () => {
    const packages = Object.entries(DEPENDENCY_MAP).filter(([, { kind }]) => kind === 'package');

    for (const [name] of packages) expect(messagesFor(portal, importing(`@events/${name}`))).toEqual([]);
  });

  it('fails an unmapped member', () => {
    expect(() => packageBoundaries('nope')).toThrow('missing from DEPENDENCY_MAP');
  });
});

describe('private schemas', () => {
  it.each([
    ['catalog', catalog],
    ['portal', portal],
  ])('rejects @events/*/schema in %s', (_, configs) => {
    expect(messagesFor(configs, importing('@events/catalog/schema'))).toEqual([
      expect.stringContaining('schema is private'),
    ]);
    expect(messagesFor(configs, importing('@events/catalog/schema/tables'))).toHaveLength(1);
  });
});

describe('kernel purity', () => {
  it.each(['pg', 'pg/lib', 'postgres', 'drizzle-orm', 'drizzle-orm/pg-core', '@prisma/client', 'server-only'])(
    'rejects %s in a kernel package',
    (source) => {
      expect(messagesFor(time, importing(source))).toHaveLength(1);
    },
  );

  it.each(['./pg', '../postgres', './pg/helper'])('does not mistake the local path %s for a driver', (source) => {
    expect(messagesFor(time, importing(source))).toEqual([]);
  });

  it('leaves non-kernel packages free to use drivers', () => {
    expect(messagesFor(catalog, importing('pg'))).toEqual([]);
  });
});

describe('testing entry points', () => {
  const testingImport = importing('@events/catalog/testing');

  it('rejects them in production code', () => {
    expect(messagesFor(portal, testingImport)).toEqual([expect.stringContaining('test files')]);
    expect(messagesFor(portal, importing('./brokenCatalog.testing'))).toHaveLength(1);
  });

  it('allows them in test files', () => {
    expect(messagesFor(portal, testingImport, 'src/file.test.js')).toEqual([]);
    expect(messagesFor(portal, importing('@events/contract/source/testing'), 'src/file.test.js')).toEqual([]);
  });
});

describe('transport-only entry points', () => {
  const transportImport = importing('@events/contract/occurrences-http');

  it('rejects them in ordinary files', () => {
    expect(messagesFor(portal, transportImport)).toEqual([expect.stringContaining('HTTP transport')]);
  });

  it('allows them in the HTTP adapter and the mocks', () => {
    expect(messagesFor(portal, transportImport, 'src/source/httpOccurrenceSource.js')).toEqual([]);
    expect(messagesFor(portal, transportImport, 'src/mocks/handlers.js')).toEqual([]);
  });

  it('rejects them in ordinary test files', () => {
    expect(messagesFor(portal, transportImport, 'src/file.test.js')).toHaveLength(1);
  });

  it('allows them in the tests of the adapter, which are both a test and an adapter file', () => {
    expect(messagesFor(portal, transportImport, 'src/source/httpOccurrenceSource.test.js')).toEqual([]);
  });

  it('still keeps testing entry points out of the adapter', () => {
    expect(messagesFor(portal, importing('@events/catalog/testing'), 'src/mocks/handlers.js')).toHaveLength(1);
  });
});
