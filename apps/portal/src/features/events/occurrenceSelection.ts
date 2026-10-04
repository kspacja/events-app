import type { OccurrenceId } from '@events/contract/occurrences';

export type PopupKey = number;

export interface SelectionPopup {
  readonly occurrenceId: OccurrenceId;
  /** Opaque: changes on every selection so a repeated one remounts the popup. */
  readonly key: PopupKey;
  /** Only a card request moves focus into the popup. */
  readonly takeFocus: boolean;
}

/** What the adapters must do now; each pending instruction stays until acknowledged. */
export interface SelectionInstructions {
  readonly popup: SelectionPopup | null;
  /** Card request: show the map and scroll it into view. Ack with `mapExpanded`. */
  readonly expandMap: boolean;
  /** Card request: fly to this occurrence. Ack with `flewTo`. */
  readonly flyTo: OccurrenceId | null;
}

export interface OccurrenceSelection {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getInstructions: () => SelectionInstructions;
  readonly selectFromCard: (occurrenceId: OccurrenceId, returnFocus: () => void) => void;
  readonly selectFromMap: (occurrenceId: OccurrenceId) => void;
  /** Clears the selection and runs the card's `returnFocus` if the card opened it. */
  readonly close: (popupKey?: PopupKey) => void;
  readonly mapExpanded: () => void;
  readonly flewTo: () => void;
}

const IDLE: SelectionInstructions = { popup: null, expandMap: false, flyTo: null };

export function createOccurrenceSelection(): OccurrenceSelection {
  const listeners = new Set<() => void>();
  let instructions = IDLE;
  let returnFocus: (() => void) | null = null;
  let lastKey: PopupKey = 0;

  function update(next: SelectionInstructions, nextReturnFocus: (() => void) | null = returnFocus) {
    instructions = next;
    returnFocus = nextReturnFocus;
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getInstructions: () => instructions,
    selectFromCard(occurrenceId, focusCard) {
      lastKey += 1;
      update(
        { popup: { occurrenceId, key: lastKey, takeFocus: true }, expandMap: true, flyTo: occurrenceId },
        focusCard,
      );
    },
    selectFromMap(occurrenceId) {
      lastKey += 1;
      update({ popup: { occurrenceId, key: lastKey, takeFocus: false }, expandMap: false, flyTo: null }, null);
    },
    close(popupKey) {
      const { popup } = instructions;
      if (!popup || (popupKey !== undefined && popupKey !== popup.key)) return;
      const focusCard = returnFocus;
      update(IDLE, null);
      focusCard?.();
    },
    mapExpanded() {
      if (instructions.expandMap) update({ ...instructions, expandMap: false });
    },
    flewTo() {
      if (instructions.flyTo) update({ ...instructions, flyTo: null });
    },
  };
}
