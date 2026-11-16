import type { Price } from '@events/contract/listing';

/** Prototype: the schools page filters, served by MSW only. Flip `placement` to move a filter between the two places. */

export type FilterPlacement = 'main' | 'advanced';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
  /** Price options only: shown for prices per pupil, per group, or in both modes when absent. */
  readonly priceMode?: PriceMode['per'];
}

export interface SchoolFilter {
  /** Query parameter, in the page URL and in the request to the events API. */
  readonly param: string;
  readonly label: string;
  readonly placement: FilterPlacement;
  readonly options: readonly FilterOption[];
  /** Matched from the listing itself (see `priceBands`), not from the traits only MSW knows. */
  readonly fromListing?: true;
}

export const SCHOOL_FILTERS: readonly SchoolFilter[] = [
  {
    param: 'wiek',
    label: 'Grupa wiekowa',
    placement: 'main',
    options: [
      { value: 'przedszkole', label: 'Przedszkole' },
      { value: '1-3', label: 'Klasy 1–3' },
      { value: '4-6', label: 'Klasy 4–6' },
      { value: '7-8', label: 'Klasy 7–8' },
      { value: 'ponadpodstawowe', label: 'Szkoły ponadpodstawowe' },
    ],
  },
  {
    param: 'przedmiot',
    label: 'Przedmiot',
    placement: 'advanced',
    options: [
      { value: 'wczesnoszkolna', label: 'edukacja wczesnoszkolna' },
      { value: 'polski', label: 'polski' },
      { value: 'matematyka', label: 'matematyka' },
      { value: 'historia', label: 'historia' },
      { value: 'fizyka', label: 'fizyka' },
      { value: 'chemia', label: 'chemia' },
      { value: 'biologia', label: 'biologia' },
      { value: 'geografia', label: 'geografia' },
      { value: 'przyroda', label: 'przyroda' },
      { value: 'informatyka', label: 'informatyka' },
      { value: 'angielski', label: 'język angielski' },
      { value: 'muzyka', label: 'muzyka' },
      { value: 'plastyka', label: 'plastyka' },
      { value: 'technika', label: 'technika' },
      { value: 'wos', label: 'WOS' },
      { value: 'wf', label: 'WF' },
    ],
  },
  {
    param: 'grupa',
    label: 'Liczba uczestników',
    placement: 'main',
    options: [
      { value: 'do-30', label: 'do 30 osób' },
      { value: '30-60', label: '30–60 osób' },
      { value: 'ponad-60', label: 'powyżej 60 osób' },
    ],
  },
  {
    param: 'rodzaj',
    label: 'Rodzaj wydarzenia',
    placement: 'advanced',
    options: [
      { value: 'jednorazowe', label: 'jednorazowe' },
      { value: 'cykliczne', label: 'cykliczne' },
      { value: 'calodzienne', label: 'całodzienne' },
    ],
  },
  {
    param: 'cena',
    label: 'Cena',
    placement: 'advanced',
    fromListing: true,
    options: [
      { value: 'bezplatne', label: 'wydarzenie bezpłatne' },
      { value: 'do-20', label: 'do 20 zł', priceMode: 'osoba' },
      { value: 'do-30', label: 'do 30 zł', priceMode: 'osoba' },
      { value: 'ponad-30', label: 'powyżej 30 zł', priceMode: 'osoba' },
      { value: 'do-300', label: 'do 300 zł', priceMode: 'grupa' },
      { value: 'do-600', label: 'do 600 zł', priceMode: 'grupa' },
      { value: 'ponad-600', label: 'powyżej 600 zł', priceMode: 'grupa' },
    ],
  },
];

/** Whether the price filter compares a pupil's price or the whole group's, and for how many pupils. */
export interface PriceMode {
  readonly per: 'osoba' | 'grupa';
  readonly people: number;
}

export const PRICE_PARAM = 'cena';
const PRICE_MODE_PARAM = 'cenaZa';
const PEOPLE_PARAM = 'osob';
/** Not filters of their own: they say how `cena` compares, so they travel with it in the URL. */
const PRICE_MODIFIERS = [PRICE_MODE_PARAM, PEOPLE_PARAM];
const DEFAULT_PEOPLE = 25;
const MAX_PEOPLE = 500;

function clampPeople(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(MAX_PEOPLE, Math.max(1, Math.round(value))) : DEFAULT_PEOPLE;
}

/** A filter's param, followed by the price modifiers when it is the price. */
function withModifiers(param: string): string[] {
  return param === PRICE_PARAM ? [param, ...PRICE_MODIFIERS] : [param];
}

/** Which filter holds each school trait of the contract, so the mocks and the details read them the same way. */
export const TRAIT_PARAMS = { ages: 'wiek', subjects: 'przedmiot', groupSizes: 'grupa', kinds: 'rodzaj' } as const;

export function priceModeOf(selection: FilterSelection): PriceMode {
  if (selection[PRICE_MODE_PARAM]?.[0] !== 'grupa') return { per: 'osoba', people: DEFAULT_PEOPLE };
  return { per: 'grupa', people: clampPeople(Number(selection[PEOPLE_PARAM]?.[0])) };
}

/** Switching the mode drops the chosen paid bands (a pupil's 20 zł means nothing for a group); "free" stays. */
export function withPriceMode(selection: FilterSelection, per: PriceMode['per']): FilterSelection {
  const rest = Object.fromEntries(Object.entries(selection).filter(([param]) => !withModifiers(PRICE_PARAM).includes(param)));
  const free: FilterSelection = selection[PRICE_PARAM]?.includes('bezplatne') ? { [PRICE_PARAM]: ['bezplatne'] } : {};
  return per === 'grupa'
    ? { ...rest, ...free, [PRICE_MODE_PARAM]: ['grupa'], [PEOPLE_PARAM]: [String(DEFAULT_PEOPLE)] }
    : { ...rest, ...free };
}

export function withPeople(selection: FilterSelection, people: number): FilterSelection {
  return { ...selection, [PEOPLE_PARAM]: [String(clampPeople(people))] };
}

/** The price options of the current mode. */
export function priceOptions(filter: SchoolFilter, mode: PriceMode): readonly FilterOption[] {
  return filter.options.filter(({ priceMode }) => !priceMode || priceMode === mode.per);
}

/**
 * The `cena` options a price falls into, read from the listing rather than from traits.
 * A range counts by its lowest price; bands overlap ("do 20" is also "do 30") and paid bands leave free events out.
 * Per pupil, a group's or an hour's price has no band; per group, a pupil's price is multiplied by the pupils and an hour counts as one session.
 */
export function priceBands(price: Price | null, mode: PriceMode = { per: 'osoba', people: DEFAULT_PEOPLE }): readonly string[] {
  if (price === null) return [];
  if (price.kind === 'free') return ['bezplatne'];
  const perPupil = !price.per || price.per === 'person';
  if (mode.per === 'osoba') {
    if (!perPupil) return [];
    if (price.from > 30) return ['ponad-30'];
    return price.from <= 20 ? ['do-20', 'do-30'] : ['do-30'];
  }
  const total = perPupil ? price.from * mode.people : price.from;
  if (total > 600) return ['ponad-600'];
  return total <= 300 ? ['do-300', 'do-600'] : ['do-600'];
}

/** Chosen option values per filter param; a filter with nothing chosen is absent. */
export type FilterSelection = Readonly<Record<string, readonly string[]>>;

type ParamSource = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>;

function rawValue(source: ParamSource, param: string): string {
  if (source instanceof URLSearchParams) return source.get(param) ?? '';
  const value = source[param];
  return Array.isArray(value) ? value.join(',') : (value ?? '');
}

/** Known options only, in config order, so the same choice always gives the same URL. */
export function parseFilters(source: ParamSource): FilterSelection {
  const selection: Record<string, readonly string[]> = {};
  if (rawValue(source, PRICE_MODE_PARAM) === 'grupa') {
    selection[PRICE_MODE_PARAM] = ['grupa'];
    selection[PEOPLE_PARAM] = [String(clampPeople(Number(rawValue(source, PEOPLE_PARAM) || DEFAULT_PEOPLE)))];
  }
  const mode = priceModeOf(selection);
  for (const filter of SCHOOL_FILTERS) {
    const asked = new Set(rawValue(source, filter.param).split(','));
    const options = filter.param === PRICE_PARAM ? priceOptions(filter, mode) : filter.options;
    const chosen = options.map(({ value }) => value).filter((value) => asked.has(value));
    if (chosen.length > 0) selection[filter.param] = chosen;
  }
  return selection;
}

/** `?wiek=1-3,4-6&przedmiot=fizyka`, or '' with nothing chosen. Commas stay readable in the URL. */
export function filtersQuery(selection: FilterSelection): string {
  const params = SCHOOL_FILTERS.flatMap(({ param }) => withModifiers(param));
  const parts = params
    .filter((param) => selection[param]?.length)
    .map((param) => `${param}=${selection[param].map(encodeURIComponent).join(',')}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export function toggleOption(selection: FilterSelection, param: string, value: string): FilterSelection {
  const current = selection[param] ?? [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return parseFilters(new URLSearchParams({ ...flatten(selection), [param]: next.join(',') }));
}

function flatten(selection: FilterSelection): Record<string, string> {
  return Object.fromEntries(Object.entries(selection).map(([param, values]) => [param, values.join(',')]));
}

/** The price mode alone narrows nothing. */
export function hasFilters(selection: FilterSelection): boolean {
  return Object.keys(selection).some((param) => !PRICE_MODIFIERS.includes(param));
}

/** Without the given placement's filters, e.g. to clear only the advanced ones. */
export function withoutPlacement(selection: FilterSelection, placement: FilterPlacement): FilterSelection {
  const kept = SCHOOL_FILTERS.filter((filter) => filter.placement !== placement).flatMap(({ param }) => withModifiers(param));
  return Object.fromEntries(Object.entries(selection).filter(([param]) => kept.includes(param)));
}

/** "Or" within a filter, "and" across filters; traits are the event's options per filter param. */
export function matchesFilters(traits: FilterSelection, selection: FilterSelection): boolean {
  return Object.entries(selection).every(
    ([param, chosen]) => PRICE_MODIFIERS.includes(param) || chosen.some((value) => traits[param]?.includes(value)),
  );
}
