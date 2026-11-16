const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Loaded only with a DSN, so browsers do not download Sentry until it is set up (ADR-0011)
if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => Sentry.init({ dsn }));
}
