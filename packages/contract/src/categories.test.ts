import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_SLUGS, getCategory } from './categories';

describe('categories', () => {
  it('gives every slug a label and a tint', () => {
    for (const slug of CATEGORY_SLUGS) {
      const { label, tint } = CATEGORIES[slug];
      expect(label).not.toBe('');
      expect(tint).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('looks a category up by slug', () => {
    expect(getCategory('music')).toEqual({ label: 'Muzyka', tint: '#F3E3D8' });
  });
});
