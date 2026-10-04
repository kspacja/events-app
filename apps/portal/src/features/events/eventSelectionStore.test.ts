import { describe, expect, it, vi } from 'vitest';
import { occurrenceIdSchema } from '@events/contract/occurrences';
import { createEventSelectionStore } from './eventSelectionStore';

const OCC_1 = occurrenceIdSchema.parse('e1-2026-06-06');
const OCC_2 = occurrenceIdSchema.parse('e2-2026-06-06');

describe('eventSelectionStore', () => {
  it('records a card request and notifies subscribers', () => {
    const store = createEventSelectionStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.selectFromCard(OCC_1, document.createElement('button'));

    expect(store.getSelection()).toMatchObject({ occurrenceId: OCC_1, source: 'card' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('gives a repeated request for the same event a new sequence number', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');

    store.selectFromCard(OCC_1, button);
    const first = store.getSelection()?.seq;
    store.selectFromCard(OCC_1, button);

    expect(store.getSelection()?.seq).not.toBe(first);
  });

  it('returns focus to the card button on close', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');
    document.body.append(button);

    store.selectFromCard(OCC_1, button);
    store.close();

    expect(store.getSelection()).toBeNull();
    expect(button).toHaveFocus();
  });

  it('does not move focus when the selection came from the map', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');
    document.body.append(button);

    store.selectFromCard(OCC_1, button);
    store.selectFromMap(OCC_2);
    store.close();

    expect(button).not.toHaveFocus();
  });

  it('stops notifying after unsubscribe', () => {
    const store = createEventSelectionStore();
    const listener = vi.fn();
    store.subscribe(listener)();

    store.selectFromMap(OCC_1);

    expect(listener).not.toHaveBeenCalled();
  });
});
