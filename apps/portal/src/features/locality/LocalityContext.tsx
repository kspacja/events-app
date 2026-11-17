'use client';

import { createContext, use, type ReactNode } from 'react';
import type { Locality, LocalityId } from '@events/contract/localities';

// The month skeleton renders outside the page, so it reads the last Miejscowość the page gave
const known = new Map<LocalityId, Locality>();

const LocalityContext = createContext<Locality | null>(null);

/** The Miejscowość in the URL, looked up by the page on the server. */
export function LocalityProvider({ locality, children }: { readonly locality: Locality | null; readonly children: ReactNode }) {
  if (locality) known.set(locality.id, locality);
  return <LocalityContext value={locality}>{children}</LocalityContext>;
}

/** The chosen Miejscowość; outside the page, the one last seen with this id. */
export function useLocality(id: LocalityId | undefined): Locality | null {
  const provided = use(LocalityContext);
  if (!id) return null;
  if (provided?.id === id) return provided;
  return known.get(id) ?? null;
}
