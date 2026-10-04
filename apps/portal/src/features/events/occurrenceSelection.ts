import type { OccurrenceId } from '@events/contract/listing';

export interface OccurrenceSelectionPopup {
  readonly occurrenceId: OccurrenceId;
  /** New on every selection so a repeated one remounts the popup. */
  readonly key: number;
  /** Only a card request moves focus into the popup. */
  readonly takeFocus: boolean;
}

/** What the adapters must do now; each pending instruction stays until acknowledged. */
export interface OccurrenceSelectionInstructions {
  readonly popup: OccurrenceSelectionPopup | null;
  /** Card request: show the map and scroll it into view. Ack with `done('expandMap')`. */
  readonly expandMap: boolean;
  /** Card request: fly to this occurrence. Ack with `done('flyTo')`. */
  readonly flyTo: OccurrenceId | null;
}

export interface OccurrenceSelection {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getInstructions: () => OccurrenceSelectionInstructions;
  readonly selectFromCard: (occurrenceId: OccurrenceId, returnFocus: () => void) => void;
  readonly selectFromMap: (occurrenceId: OccurrenceId) => void;
  /** Clears the selection and runs the card's `returnFocus` if the card opened it; a replaced `popup` is ignored. */
  readonly close: (popup?: OccurrenceSelectionPopup) => void;
  /** Acknowledges a pending instruction so it is not handed out again. */
  readonly done: (instruction: 'expandMap' | 'flyTo') => void;
}

export const IDLE_INSTRUCTIONS: OccurrenceSelectionInstructions = { popup: null, expandMap: false, flyTo: null };

export function createOccurrenceSelection(): OccurrenceSelection {
  const listeners = new Set<() => void>();
  let instructions = IDLE_INSTRUCTIONS;
  let returnFocus: (() => void) | null = null;
  let lastKey = 0;

  function update(next: OccurrenceSelectionInstructions, nextReturnFocus: (() => void) | null) {
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
    close(closing) {
      if (!instructions.popup || (closing && closing !== instructions.popup)) return;
      const focusCard = returnFocus;
      update(IDLE_INSTRUCTIONS, null);
      focusCard?.();
    },
    done(instruction) {
      if (instruction === 'expandMap') {
        if (instructions.expandMap) update({ ...instructions, expandMap: false }, returnFocus);
      } else if (instructions.flyTo) {
        update({ ...instructions, flyTo: null }, returnFocus);
      }
    },
  };
}
