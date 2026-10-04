import { describe, expect, it, vi } from 'vitest';
import { occurrenceIdSchema } from '@events/contract/listing';
import { createOccurrenceSelection } from './occurrenceSelection';

const OCC_1 = occurrenceIdSchema.parse('e1-2026-06-06');
const OCC_2 = occurrenceIdSchema.parse('e2-2026-06-06');

describe('occurrenceSelection', () => {
  it('starts with nothing to do', () => {
    const selection = createOccurrenceSelection();

    expect(selection.getInstructions()).toEqual({ popup: null, expandMap: false, flyTo: null });
  });

  it('asks to expand the map, fly there and focus the popup after a card request', () => {
    const selection = createOccurrenceSelection();
    const listener = vi.fn();
    selection.subscribe(listener);

    selection.selectFromCard(OCC_1, () => {});

    expect(selection.getInstructions()).toMatchObject({
      popup: { occurrenceId: OCC_1, takeFocus: true },
      expandMap: true,
      flyTo: OCC_1,
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('asks for no expand, fly or focus after a map click', () => {
    const selection = createOccurrenceSelection();

    selection.selectFromMap(OCC_1);

    expect(selection.getInstructions()).toMatchObject({
      popup: { occurrenceId: OCC_1, takeFocus: false },
      expandMap: false,
      flyTo: null,
    });
  });

  it('hands out the fly target until the map confirms the flight, once', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});

    selection.flewTo();
    const listener = vi.fn();
    selection.subscribe(listener);
    selection.flewTo();

    expect(selection.getInstructions().flyTo).toBeNull();
    expect(selection.getInstructions().popup?.occurrenceId).toBe(OCC_1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops asking to expand once the map is expanded', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});

    selection.mapExpanded();

    expect(selection.getInstructions().expandMap).toBe(false);
    expect(selection.getInstructions().flyTo).toBe(OCC_1);
  });

  it('triggers again when the same occurrence is requested again', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});
    const firstKey = selection.getInstructions().popup?.key;
    selection.flewTo();
    selection.mapExpanded();

    selection.selectFromCard(OCC_1, () => {});

    expect(selection.getInstructions()).toMatchObject({ expandMap: true, flyTo: OCC_1 });
    expect(selection.getInstructions().popup?.key).not.toBe(firstKey);
  });

  it('replaces a pending fly target with the new selection', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});

    selection.selectFromMap(OCC_2);

    expect(selection.getInstructions()).toMatchObject({
      popup: { occurrenceId: OCC_2 },
      flyTo: null,
      expandMap: false,
    });
  });

  it('returns focus to the card exactly once when closing a card selection', () => {
    const selection = createOccurrenceSelection();
    const returnFocus = vi.fn();
    selection.selectFromCard(OCC_1, returnFocus);

    selection.close();
    selection.close();

    expect(returnFocus).toHaveBeenCalledOnce();
    expect(selection.getInstructions().popup).toBeNull();
  });

  it('clears pending instructions on close', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});

    selection.close();

    expect(selection.getInstructions()).toEqual({ popup: null, expandMap: false, flyTo: null });
  });

  it('does not return focus after a map selection', () => {
    const selection = createOccurrenceSelection();
    const returnFocus = vi.fn();
    selection.selectFromCard(OCC_1, returnFocus);
    selection.selectFromMap(OCC_2);

    selection.close();

    expect(returnFocus).not.toHaveBeenCalled();
  });

  it('ignores a close from a popup that was already replaced', () => {
    const selection = createOccurrenceSelection();
    selection.selectFromCard(OCC_1, () => {});
    const staleKey = selection.getInstructions().popup?.key;
    selection.selectFromCard(OCC_1, () => {});

    selection.close(staleKey);

    expect(selection.getInstructions().popup).not.toBeNull();
  });

  it('stops notifying after unsubscribe', () => {
    const selection = createOccurrenceSelection();
    const listener = vi.fn();
    selection.subscribe(listener)();

    selection.selectFromMap(OCC_1);

    expect(listener).not.toHaveBeenCalled();
  });
});
