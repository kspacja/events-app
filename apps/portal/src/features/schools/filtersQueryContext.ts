'use client';

import { createContext, useContext } from 'react';

/** The page's school filters as a query string (`?wiek=…` or ''), so week and day links keep them. */
export const FiltersQueryContext = createContext('');

export function useFiltersQuery(): string {
  return useContext(FiltersQueryContext);
}
