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
  readonly label: string;
  readonly tint: string;
}

export const CATEGORIES: Readonly<Record<CategorySlug, Category>> = {
  music: { label: 'Muzyka', tint: '#F3E3D8' },
  film: { label: 'Film', tint: '#DDE6EE' },
  food: { label: 'Jedzenie', tint: '#EDE6D6' },
  movement: { label: 'Ruch', tint: '#E3EADB' },
  workshops: { label: 'Warsztaty', tint: '#EBE1E8' },
  art: { label: 'Sztuka', tint: '#E6E3EE' },
  meetups: { label: 'Spotkania', tint: '#EFE6DC' },
  comedy: { label: 'Komedia', tint: '#F1E6D2' },
};

export function getCategory(slug: CategorySlug): Category {
  return CATEGORIES[slug];
}
