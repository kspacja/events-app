/** Prototype: the schools page filters, served by MSW only. Flip `placement` to move a filter between the two places. */

export type FilterPlacement = 'main' | 'advanced';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export interface SchoolFilter {
  /** Query parameter, in the page URL and in the request to the events API. */
  readonly param: string;
  readonly label: string;
  readonly placement: FilterPlacement;
  readonly options: readonly FilterOption[];
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
];

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
  for (const { param, options } of SCHOOL_FILTERS) {
    const asked = new Set(rawValue(source, param).split(','));
    const chosen = options.map(({ value }) => value).filter((value) => asked.has(value));
    if (chosen.length > 0) selection[param] = chosen;
  }
  return selection;
}

/** `?wiek=1-3,4-6&przedmiot=fizyka`, or '' with nothing chosen. Commas stay readable in the URL. */
export function filtersQuery(selection: FilterSelection): string {
  const parts = SCHOOL_FILTERS.filter(({ param }) => selection[param]?.length).map(
    ({ param }) => `${param}=${selection[param].map(encodeURIComponent).join(',')}`,
  );
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

export function hasFilters(selection: FilterSelection): boolean {
  return Object.keys(selection).length > 0;
}

/** Without the given placement's filters, e.g. to clear only the advanced ones. */
export function withoutPlacement(selection: FilterSelection, placement: FilterPlacement): FilterSelection {
  const kept = SCHOOL_FILTERS.filter((filter) => filter.placement !== placement).map(({ param }) => param);
  return Object.fromEntries(Object.entries(selection).filter(([param]) => kept.includes(param)));
}

/** "Or" within a filter, "and" across filters; traits are the event's options per filter param. */
export function matchesFilters(traits: FilterSelection, selection: FilterSelection): boolean {
  return Object.entries(selection).every(([param, chosen]) =>
    chosen.some((value) => traits[param]?.includes(value)),
  );
}
