export type SelectionSource = 'card' | 'map';

export interface EventSelection {
  readonly occurrenceId: string;
  readonly seq: number;
  readonly source: SelectionSource;
}

export interface EventSelectionStore {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSelection: () => EventSelection | null;
  readonly selectFromMap: (occurrenceId: string) => void;
  readonly selectFromCard: (occurrenceId: string, trigger: HTMLElement) => void;
  /** Clears the selection; focus goes back to the card button that opened it, if any. */
  readonly close: () => void;
}

export function createEventSelectionStore(): EventSelectionStore {
  const listeners = new Set<() => void>();
  let selection: EventSelection | null = null;
  let trigger: HTMLElement | null = null;
  let seq = 0;

  function set(next: EventSelection | null, nextTrigger: HTMLElement | null) {
    selection = next;
    trigger = nextTrigger;
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSelection: () => selection,
    selectFromMap: (occurrenceId) => set({ occurrenceId, seq: ++seq, source: 'map' }, null),
    selectFromCard: (occurrenceId, button) => set({ occurrenceId, seq: ++seq, source: 'card' }, button),
    close() {
      if (!selection) return;
      const returnTo = trigger;
      set(null, null);
      returnTo?.focus();
    },
  };
}
