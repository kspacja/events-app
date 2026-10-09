import tseslint from 'typescript-eslint';

const NO_DEEP_IMPORT_MESSAGE = 'Import only what the package declares in "exports".';
const NO_RELATIVE_SEAM_MESSAGE = 'Reach packages by name (@events/...), not through relative paths.';
const FRAMEWORK_FREE_MESSAGE = 'Packages must stay framework-free.';

/** The one place that says who may import whom (ADR-0002); `mayImport` is '*' or the @events/* packages allowed besides itself. */
export const DEPENDENCY_MAP = {
  time: { kind: 'package', kernel: true, mayImport: [] },
  contract: { kind: 'package', kernel: true, mayImport: ['time'] },
  repo: { kind: 'package', kernel: false, mayImport: ['contract', 'time'] },
  // ui is CSS-only for now: it has no eslint config, so this entry takes effect once it gains code
  ui: { kind: 'package', kernel: true, mayImport: [] },
  'eslint-config': { kind: 'tooling', kernel: false, mayImport: [] },
  // Only the backend reaches the database; Next.js apps go through HTTP (ADR-0008)
  portal: { kind: 'app', kernel: false, mayImport: '*', database: false },
  api: { kind: 'app', kernel: false, mayImport: '*', database: true },
};

const DB_DRIVERS = ['pg', 'postgres', 'drizzle-orm', '@neondatabase/*', 'kysely', 'prisma', '@prisma/*'];

const KERNEL_PURITY_PATTERNS = [
  {
    group: [...DB_DRIVERS.flatMap((name) => [`/${name}`, `/${name}/**`]), 'server-only'],
    message: 'Kernel packages (time, contract, ui) must not import database drivers, ORMs or server-only.',
  },
];

const NO_DATABASE_PATTERNS = [
  {
    group: DB_DRIVERS.flatMap((name) => [`/${name}`, `/${name}/**`]),
    message: 'Only apps/api talks to the database; Next.js apps read it over HTTP (ADR-0008).',
  },
];

const SCHEMA_PRIVATE_PATTERN = {
  group: ['@events/*/schema', '@events/*/schema/**', '@events/*/db', '@events/*/db/**'],
  message: 'A context schema is private; use the context repository functions instead.',
};

function packageNames() {
  return Object.entries(DEPENDENCY_MAP)
    .filter(([, entry]) => entry.kind === 'package')
    .map(([name]) => name);
}

function allowedPackages(name) {
  const { mayImport } = DEPENDENCY_MAP[name];
  return [name, ...(mayImport === '*' ? packageNames() : mayImport)];
}

function dependencyPattern(name) {
  const allowed = allowedPackages(name).map((dep) => `!@events/${dep}`);
  return {
    // Gitignore-style: block every @events/* and re-allow the mapped ones (and so their subpaths)
    group: ['@events/*', ...allowed],
    message: `${name} may import only: ${allowedPackages(name).join(', ')} (see DEPENDENCY_MAP).`,
  };
}

function entryFor(name) {
  if (!DEPENDENCY_MAP[name]) throw new Error(`"${name}" is missing from DEPENDENCY_MAP.`);
  return DEPENDENCY_MAP[name];
}

const DEEP_IMPORT_PATTERNS = [
  {
    group: ['@events/*/src', '@events/*/src/**'],
    message: NO_DEEP_IMPORT_MESSAGE,
  },
  {
    group: ['**/packages/**', '**/apps/**'],
    message: NO_RELATIVE_SEAM_MESSAGE,
  },
];

const PACKAGE_PATHS = [
  { name: 'next', message: FRAMEWORK_FREE_MESSAGE },
  { name: 'react', message: FRAMEWORK_FREE_MESSAGE },
  { name: 'react-dom', message: FRAMEWORK_FREE_MESSAGE },
];

const PACKAGE_PATTERNS = [
  {
    // A package's own files are reached with ./ or a deeper ../; ../<name>/src is a sibling package
    group: ['../*/src', '../*/src/**', '../../*/src', '../../*/src/**'],
    message: NO_RELATIVE_SEAM_MESSAGE,
  },
  {
    group: ['@/*', 'next/*', 'react/*', 'react-dom/*'],
    message: 'Packages must not depend on an app or a UI framework.',
  },
  {
    // Future apps: add their name here
    group: ['@events/portal', '@events/portal/**', '@events/api', '@events/api/**'],
    message: 'Packages must not import apps.',
  },
];

const TESTING_ONLY_PATTERN = {
  group: ['@events/repo/testing', '**/*.testing', '**/*.testing.*'],
  message: 'Testing entry points may only be imported from test files.',
};

const HTTP_TRANSPORT_ONLY_PATTERN = {
  group: ['@events/contract/occurrences-http'],
  message: 'The HTTP transport is for the HTTP adapter, the mocks and the API route only.',
};

const CONFIG_FILES = ['**/eslint.config.mjs'];
const TEST_FILES = ['**/*.test.*', '**/*.testing.*', '**/vitest.setup.*'];
const HTTP_TRANSPORT_FILES = ['**/source/httpOccurrenceSource*', '**/mocks/**', '**/occurrencesRoute*'];

function restrictImports({ paths, patterns }, scope = {}) {
  // The lint config itself imports @events/eslint-config, which the map does not cover
  return { ...scope, ignores: CONFIG_FILES, rules: { 'no-restricted-imports': ['error', { paths, patterns }] } };
}

/** no-restricted-imports replaces per file, so each layer restates the list; later layers win, and the last one is for files matching both a test and a transport glob. */
function withEntryPointRules({ paths, patterns }) {
  const restrict = (extra, scope) => restrictImports({ paths, patterns: [...patterns, ...extra] }, scope);
  return [
    restrict([TESTING_ONLY_PATTERN, HTTP_TRANSPORT_ONLY_PATTERN]),
    restrict([TESTING_ONLY_PATTERN], { files: HTTP_TRANSPORT_FILES }),
    restrict([HTTP_TRANSPORT_ONLY_PATTERN], { files: TEST_FILES }),
    restrict([], {
      files: TEST_FILES.flatMap((test) => HTTP_TRANSPORT_FILES.map((http) => [test, http])),
    }),
  ];
}

/** Seams for an app: no deep imports, no relative paths across packages, mapped dependencies, private schemas, and no database drivers unless the map says `database: true`. */
export function appBoundaries(name) {
  const { database } = entryFor(name);
  return withEntryPointRules({
    paths: [],
    patterns: [
      ...DEEP_IMPORT_PATTERNS,
      SCHEMA_PRIVATE_PATTERN,
      dependencyPattern(name),
      ...(database ? [] : NO_DATABASE_PATTERNS),
    ],
  });
}

/** Same as appBoundaries, plus: framework-free, no apps, and no database drivers in kernel packages. */
export function packageBoundaries(name) {
  const { kernel } = entryFor(name);
  return withEntryPointRules({
    paths: PACKAGE_PATHS,
    patterns: [
      ...DEEP_IMPORT_PATTERNS,
      ...PACKAGE_PATTERNS,
      SCHEMA_PRIVATE_PATTERN,
      dependencyPattern(name),
      ...(kernel ? KERNEL_PURITY_PATTERNS : []),
    ],
  });
}

/** Type-aware rules that code-quality-js.md requires; needs the TS project service. */
export function typeAwareRules({ tsconfigRootDir }) {
  return {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  };
}

/** Base config for TS packages: typescript-eslint recommended + type-aware rules. */
export function tsPackageConfig({ tsconfigRootDir }) {
  return [...tseslint.configs.recommended, typeAwareRules({ tsconfigRootDir })];
}
