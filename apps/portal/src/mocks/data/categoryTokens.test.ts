import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { generateOccurrences } from './occurrences';

const tokensCss = readFileSync(
  createRequire(import.meta.url).resolve('@events/ui/tokens.css'),
  'utf8',
);

const usedSlugs = [
  ...new Set(generateOccurrences().map(({ event }) => event.category.slug)),
];

describe('category colour tokens', () => {
  it.each(usedSlugs)('defines --category-%s for a category used by the mock data', (slug) => {
    expect(tokensCss).toMatch(new RegExp(`--category-${slug}\\s*:`));
  });

  it('defines the fallback for categories without their own colour', () => {
    expect(tokensCss).toMatch(/--category-fallback\s*:/);
  });
});
