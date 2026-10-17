const MOCKING_STARTED = Symbol.for('events-app.msw-started');

type MockingGlobal = typeof globalThis & { [MOCKING_STARTED]?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { getRuntimeConfig } = await import('./config/runtimeConfig');
  const config = getRuntimeConfig();
  if (!config.mocking) return;

  const scope = globalThis as MockingGlobal;
  // register() can run again on HMR; listening twice would double-patch fetch
  if (scope[MOCKING_STARTED]) return;
  scope[MOCKING_STARTED] = true;

  const { createMockServer } = await import('./mocks/node');
  createMockServer(config.eventsApiUrl).listen({ onUnhandledFrame: 'bypass' });
  keepMockedFetch(globalThis.fetch);
}

/**
 * On every server reload next dev puts back the plain fetch it saw at startup, which silently drops MSW.
 * A plain fetch carries no __nextPatched mark, so any such assignment gets MSW's fetch instead;
 * Next's own wrapper (marked) passes through and ends up wrapping MSW's fetch.
 */
function keepMockedFetch(mockedFetch: typeof fetch) {
  let current = mockedFetch;
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    get: () => current,
    set: (value: typeof fetch & { __nextPatched?: boolean }) => {
      current = value.__nextPatched ? value : mockedFetch;
    },
  });
}
