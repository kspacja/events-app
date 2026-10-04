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
export const CATEGORIES: readonly Category[] = [
  { slug: 'music', label: 'Muzyka' },
  { slug: 'film', label: 'Film' },
  { slug: 'food', label: 'Jedzenie' },
  { slug: 'movement', label: 'Ruch' },
  { slug: 'workshops', label: 'Warsztaty' },
  { slug: 'art', label: 'Sztuka' },
  { slug: 'meetups', label: 'Spotkania' },
  { slug: 'comedy', label: 'Komedia' },
];
