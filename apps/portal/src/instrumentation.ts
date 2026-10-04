const MOCKING_STARTED = Symbol.for('events-app.msw-started');

type MockingGlobal = typeof globalThis & { [MOCKING_STARTED]?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { getRuntimeConfig } = await import('./config/runtimeConfig');
  const config = getRuntimeConfig();
  if (config.source !== 'http' || !config.mocking) return;

  const scope = globalThis as MockingGlobal;
  // register() can run again on HMR; listening twice would double-patch fetch
  if (scope[MOCKING_STARTED]) return;
  scope[MOCKING_STARTED] = true;

  const { createMockServer } = await import('./mocks/node');
  createMockServer(config.eventsApiUrl).listen({ onUnhandledFrame: 'bypass' });
}
