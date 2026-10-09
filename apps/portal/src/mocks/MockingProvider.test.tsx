import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const startBrowserMocking = vi.fn(async () => {});
vi.mock('./browser', () => ({ startBrowserMocking }));

// The provider keeps one worker per page load in module state, so each test loads a fresh copy
async function loadProvider() {
  vi.resetModules();
  return import('./MockingProvider');
}

describe('MockingProvider', () => {
  beforeEach(() => {
    startBrowserMocking.mockClear();
  });

  it('starts nothing when mocking is off', async () => {
    const { MockingProvider } = await loadProvider();

    render(
      <MockingProvider enabled={false} eventsApiUrl="http://api.test">
        <p>page</p>
      </MockingProvider>,
    );

    await vi.dynamicImportSettled();
    expect(startBrowserMocking).not.toHaveBeenCalled();
  });

  it('starts the worker once for the API URL, however often it renders', async () => {
    const { MockingProvider } = await loadProvider();
    const page = (
      <MockingProvider enabled eventsApiUrl="http://api.test">
        <p>page</p>
      </MockingProvider>
    );

    render(page);
    render(page);

    await vi.waitFor(() => expect(startBrowserMocking).toHaveBeenCalledTimes(1));
    expect(startBrowserMocking).toHaveBeenCalledWith('http://api.test');
  });
});
