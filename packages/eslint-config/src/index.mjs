import tseslint from 'typescript-eslint';

const NO_DEEP_IMPORT_MESSAGE = 'Import only what the package declares in "exports".';
const NO_RELATIVE_SEAM_MESSAGE = 'Reach packages by name (@events/...), not through relative paths.';
const FRAMEWORK_FREE_MESSAGE = 'Packages must stay framework-free.';

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
    group: ['@events/portal', '@events/portal/**'],
    message: 'Packages must not import apps.',
  },
];

const TESTING_ONLY_PATTERN = {
  group: ['@events/contract/source/testing', '@events/catalog/testing'],
  message: 'Testing entry points may only be imported from test files.',
};

const HTTP_TRANSPORT_ONLY_PATTERN = {
  group: ['@events/contract/occurrences-http'],
  message: 'The HTTP transport is for the HTTP adapter and the mocks only.',
};

const TEST_FILES = ['**/*.test.*', '**/vitest.setup.*'];
const HTTP_TRANSPORT_FILES = ['**/source/httpOccurrenceSource*', '**/mocks/**'];

function restrictImports({ paths, patterns }, scope = {}) {
  return { ...scope, rules: { 'no-restricted-imports': ['error', { paths, patterns }] } };
}

/**
 * no-restricted-imports replaces (not merges) per file, so each layer restates the full list;
 * later layers win: everywhere, then the allowed files of each restricted entry point.
 * A nested `files` array ANDs its globs: the last layer is for files matching both a test and a transport glob.
 */
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

/**
 * Package/app seams: no deep imports into a package's src and no relative paths across
 * packages/apps, plus the entry-point rules of @events/contract. Context-to-context seams
 * (ADR-0002) arrive with packages/catalog.
 */
export const appBoundaries = withEntryPointRules({ paths: [], patterns: DEEP_IMPORT_PATTERNS });

/** Same as appBoundaries, plus: packages stay framework-free and must not import apps. */
export const packageBoundaries = withEntryPointRules({
  paths: PACKAGE_PATHS,
  patterns: [...DEEP_IMPORT_PATTERNS, ...PACKAGE_PATTERNS],
});

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
