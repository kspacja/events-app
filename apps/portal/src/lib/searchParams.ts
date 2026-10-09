/** A page's `searchParams` after awaiting: a key may repeat, so a value may be a list. */
export type SearchParamsInput = Readonly<Record<string, string | readonly string[] | undefined>>;

/** The first value of a parameter that may repeat. */
export function firstValue(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}
