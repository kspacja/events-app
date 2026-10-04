import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { CATEGORY_SLUGS } from '@events/contract/categories';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(
  createRequire(import.meta.url).resolve('@events/ui/tokens.css'),
  'utf8',
);

describe('category colour tokens', () => {
  it.each(CATEGORY_SLUGS)('defines --category-%s in tokens.css', (slug) => {
    expect(tokensCss).toMatch(new RegExp(`--category-${slug}\\s*:`));
  });
});
