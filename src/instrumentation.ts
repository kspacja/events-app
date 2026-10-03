const MOCKING_STARTED = Symbol.for('events-app.msw-started');

type MockingGlobal = typeof globalThis & { [MOCKING_STARTED]?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.API_MOCKING !== 'enabled') return;

  const scope = globalThis as MockingGlobal;
  // register() can run again on HMR; listening twice would double-patch fetch
  if (scope[MOCKING_STARTED]) return;
  scope[MOCKING_STARTED] = true;

  const { server } = await import('./mocks/node');
  server.listen({ onUnhandledFrame: 'bypass' });
}
