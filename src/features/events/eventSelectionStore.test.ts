import { describe, expect, it, vi } from 'vitest';
import { createEventSelectionStore } from './eventSelectionStore';

describe('eventSelectionStore', () => {
  it('records a card request and notifies subscribers', () => {
    const store = createEventSelectionStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.selectFromCard('e1', document.createElement('button'));

    expect(store.getSelection()).toMatchObject({ id: 'e1', source: 'card' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('gives a repeated request for the same event a new sequence number', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');

    store.selectFromCard('e1', button);
    const first = store.getSelection()?.seq;
    store.selectFromCard('e1', button);

    expect(store.getSelection()?.seq).not.toBe(first);
  });

  it('returns focus to the card button on close', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');
    document.body.append(button);

    store.selectFromCard('e1', button);
    store.close();

    expect(store.getSelection()).toBeNull();
    expect(button).toHaveFocus();
  });

  it('does not move focus when the selection came from the map', () => {
    const store = createEventSelectionStore();
    const button = document.createElement('button');
    document.body.append(button);

    store.selectFromCard('e1', button);
    store.selectFromMap('e2');
    store.close();

    expect(button).not.toHaveFocus();
  });

  it('stops notifying after unsubscribe', () => {
    const store = createEventSelectionStore();
    const listener = vi.fn();
    store.subscribe(listener)();

    store.selectFromMap('e1');

    expect(listener).not.toHaveBeenCalled();
  });
});
