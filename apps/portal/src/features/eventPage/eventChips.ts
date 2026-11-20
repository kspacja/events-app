import type { OccurrenceListing } from '@events/contract/listing';
import { SCHOOL_FILTERS, TRAIT_PARAMS } from '@/features/schools/schoolFilters';

export function traitLabels(trait: keyof typeof TRAIT_PARAMS, values: readonly string[] = []): string[] {
  const filter = SCHOOL_FILTERS.find(({ param }) => param === TRAIT_PARAMS[trait]);
  return filter ? filter.options.filter(({ value }) => values.includes(value)).map(({ label }) => label) : [];
}

/** The chips under the title: age groups, subjects, then categories; a category named like a subject shows once. */
export function eventChips(event: OccurrenceListing['event']): string[] {
  const chips = [
    ...traitLabels('ages', event.school?.ages),
    ...traitLabels('subjects', event.school?.subjects),
    ...event.categories.map(({ label }) => label),
  ];
  return chips.filter((chip, index) => chips.findIndex((other) => other.toLowerCase() === chip.toLowerCase()) === index);
}

/** Two letters for the organizer's logo until institutions upload their own. */
export function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
