import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
  // Drop noise we can't fix: Google's Reader Revenue Manager script (fails on
  // old Safari and in headless bots) and browser extensions.
  denyUrls: [
    /swg\/js\/v1\/swg-basic\.js/,
    /^(chrome|moz|safari(-web)?)-extension:\/\//,
  ],
  ignoreErrors: [/runtime\.sendMessage\(\)/],
  integrations: [
    Sentry.browserTracingIntegration && Sentry.browserTracingIntegration(),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
