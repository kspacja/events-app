'use client';

import {
  createContext,
  use,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  createEventSelectionStore,
  type EventSelection,
  type EventSelectionStore,
} from './eventSelectionStore';

const EventSelectionContext = createContext<EventSelectionStore | null>(null);

interface EventSelectionProviderProps {
  readonly children: ReactNode;
}

export function EventSelectionProvider({ children }: EventSelectionProviderProps) {
  const [store] = useState(createEventSelectionStore);

  return <EventSelectionContext value={store}>{children}</EventSelectionContext>;
}

export function useEventSelectionStore(): EventSelectionStore {
  const store = use(EventSelectionContext);
  if (!store) throw new Error('useEventSelectionStore needs an EventSelectionProvider');
  return store;
}

const getServerSelection = () => null;

export function useEventSelection(): EventSelection | null {
  const { subscribe, getSelection } = useEventSelectionStore();
  return useSyncExternalStore(subscribe, getSelection, getServerSelection);
}
