import * as Sentry from "@sentry/nestjs";

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // Adjust this value in production to reduce volume.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Only send events when a DSN is configured
  enabled: !!process.env.SENTRY_DSN,

  // Attach server name for easier debugging
  serverName: process.env.HOSTNAME || "sgc-backend",

  // Release tracking (use package.json version or git SHA)
  release: process.env.SENTRY_RELEASE || undefined,
});
