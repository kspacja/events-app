const DEEP_IMPORT_PATTERNS = [
  {
    group: ['@events/*/src', '@events/*/src/**'],
    message: 'Import only what the package declares in "exports".',
  },
  {
    group: ['**/packages/**', '**/apps/**'],
    message: 'Reach packages by name (@events/...), not through relative paths.',
  },
];

const PACKAGE_PATHS = [
  { name: 'next', message: 'Packages must stay framework-free.' },
  { name: 'react', message: 'Packages must stay framework-free.' },
  { name: 'react-dom', message: 'Packages must stay framework-free.' },
];

const PACKAGE_PATTERNS = [
  {
    group: ['@/*', 'next/*', 'react/*', 'react-dom/*'],
    message: 'Packages must not depend on an app or a UI framework.',
  },
  {
    group: ['@events/portal', '@events/portal/**', '@events/studio', '@events/studio/**', '@events/moderation', '@events/moderation/**', '@events/worker', '@events/worker/**'],
    message: 'Packages must not import apps.',
  },
];

/** Seam rules from ADR-0002; pass `isPackage` for code under packages/*. */
export function importBoundaries({ isPackage }) {
  return {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: isPackage ? PACKAGE_PATHS : [],
          patterns: isPackage
            ? [...DEEP_IMPORT_PATTERNS, ...PACKAGE_PATTERNS]
            : DEEP_IMPORT_PATTERNS,
        },
      ],
    },
  };
}
