import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from '@/mocks/node';

// jsdom has no <dialog>, Popover API or matchMedia behaviour
HTMLDialogElement.prototype.show = function show() {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

const openPopovers = new WeakSet<HTMLElement>();

function setPopoverOpen(element: HTMLElement, open: boolean) {
  if (openPopovers.has(element) === open) return;
  if (open) openPopovers.add(element);
  else openPopovers.delete(element);
  element.dispatchEvent(
    Object.assign(new Event('toggle'), { newState: open ? 'open' : 'closed' }),
  );
}

HTMLElement.prototype.showPopover = function showPopover() {
  setPopoverOpen(this, true);
};
HTMLElement.prototype.hidePopover = function hidePopover() {
  setPopoverOpen(this, false);
};
HTMLElement.prototype.togglePopover = function togglePopover() {
  setPopoverOpen(this, !openPopovers.has(this));
  return openPopovers.has(this);
};

// Native invoker behaviour of <button popovertarget>
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const id = event.target.closest('[popovertarget]')?.getAttribute('popovertarget');
  const target = id ? document.getElementById(id) : null;
  target?.togglePopover();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
