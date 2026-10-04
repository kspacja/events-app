'use client';

import { createContext, use, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  createOccurrenceSelection,
  IDLE_INSTRUCTIONS,
  type OccurrenceSelection,
  type OccurrenceSelectionInstructions,
} from './occurrenceSelection';

const OccurrenceSelectionContext = createContext<OccurrenceSelection | null>(null);

interface OccurrenceSelectionProviderProps {
  readonly children: ReactNode;
}

export function OccurrenceSelectionProvider({ children }: OccurrenceSelectionProviderProps) {
  const [selection] = useState(createOccurrenceSelection);

  return <OccurrenceSelectionContext value={selection}>{children}</OccurrenceSelectionContext>;
}

export function useOccurrenceSelection(): OccurrenceSelection {
  const selection = use(OccurrenceSelectionContext);
  if (!selection) throw new Error('useOccurrenceSelection needs an OccurrenceSelectionProvider');
  return selection;
}

const getServerInstructions = () => IDLE_INSTRUCTIONS;

export function useOccurrenceSelectionInstructions(): OccurrenceSelectionInstructions {
  const { subscribe, getInstructions } = useOccurrenceSelection();
  return useSyncExternalStore(subscribe, getInstructions, getServerInstructions);
}
