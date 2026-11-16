import type { OccurrenceListing, Price } from '@events/contract/listing';
import { SCHOOL_FILTERS } from '../schoolFilters';
import { EVENT_DETAILS_LABELS as LABELS } from './labels';

export interface EventFact {
  readonly label: string;
  readonly value: string;
}

// Which filter names each school trait; its options give the labels
const TRAIT_FILTERS = { ages: 'wiek', subjects: 'przedmiot', groupSizes: 'grupa', kinds: 'rodzaj' } as const;

const PER = { person: 'os.', group: 'grupa', hour: 'godz.' } as const;

/** "bezpłatne", "15 zł / os.", "15–25 zł / os.", "350 zł / grupa", "120 zł / godz." */
export function formatPrice(price: Price): string {
  if (price.kind === 'free') return LABELS.free;
  const amount = price.to === null || price.to === price.from ? `${price.from}` : `${price.from}–${price.to}`;
  return `${amount} zł / ${PER[price.per ?? 'person']}`;
}

function traitFact(trait: keyof typeof TRAIT_FILTERS, values: readonly string[]): EventFact | null {
  const filter = SCHOOL_FILTERS.find(({ param }) => param === TRAIT_FILTERS[trait]);
  if (!filter || values.length === 0) return null;
  const labels = filter.options.filter(({ value }) => values.includes(value)).map(({ label }) => label);
  return labels.length > 0 ? { label: filter.label, value: labels.join(', ') } : null;
}

/** School traits and categories; the price sits beside the date. Facts the event lacks are left out, not shown empty. */
export function eventFacts({ event }: OccurrenceListing): EventFact[] {
  const facts: (EventFact | null)[] = [
    ...(event.school
      ? [
          traitFact('ages', event.school.ages),
          traitFact('subjects', event.school.subjects),
          traitFact('groupSizes', event.school.groupSizes),
          traitFact('kinds', event.school.kinds),
        ]
      : []),
    { label: LABELS.categories, value: event.categories.map(({ label }) => label).join(', ') },
  ];
  return facts.filter((fact): fact is EventFact => fact !== null);
}
