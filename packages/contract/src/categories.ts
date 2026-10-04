export const CATEGORY_SLUGS = [
  'music',
  'film',
  'food',
  'movement',
  'workshops',
  'art',
  'meetups',
  'comedy',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  readonly slug: CategorySlug;
  readonly label: string;
}

// Temporary home: becomes Catalog rows in stage 1
export const CATEGORY_LABELS: Readonly<Record<CategorySlug, string>> = {
  music: 'Muzyka',
  film: 'Film',
  food: 'Jedzenie',
  movement: 'Ruch',
  workshops: 'Warsztaty',
  art: 'Sztuka',
  meetups: 'Spotkania',
  comedy: 'Komedia',
};

export const CATEGORIES: readonly Category[] = CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: CATEGORY_LABELS[slug],
}));
