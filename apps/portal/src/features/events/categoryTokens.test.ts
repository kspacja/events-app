import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createSampleEvents } from '@events/repo';

const tokensCss = readFileSync(
  createRequire(import.meta.url).resolve('@events/ui/tokens.css'),
  'utf8',
);

const { categories } = createSampleEvents(new Date());

describe('category colour tokens', () => {
  it.each(categories.map(({ slug }) => slug))('defines --category-%s for a sample category', (slug) => {
    expect(tokensCss).toMatch(new RegExp(`--category-${slug}\\s*:`));
  });

  it('defines the fallback for categories without their own colour', () => {
    expect(tokensCss).toMatch(/--category-fallback\s*:/);
  });
});
