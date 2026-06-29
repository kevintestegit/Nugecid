import { User } from "@/types";

type SentryModule = typeof import("@sentry/react");

const globalMonitoringState = globalThis as typeof globalThis & {
  __sgcMonitoringInitialized?: boolean;
};

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const monitoringEnabled = Boolean(sentryDsn);

let sentryPromise: Promise<SentryModule> | null = null;

const getSentry = (): Promise<SentryModule> => {
  if (!sentryPromise) {
    sentryPromise = import("@sentry/react");
  }
  return sentryPromise;
};

const parseSampleRate = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }
  return fallback;
};

export const isMonitoringEnabled = (): boolean => monitoringEnabled;

export const initMonitoring = (): void => {
  if (!monitoringEnabled || globalMonitoringState.__sgcMonitoringInitialized) {
    return;
  }
  globalMonitoringState.__sgcMonitoringInitialized = true;

  void getSentry().then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      enabled: monitoringEnabled,
      environment:
        import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
        0.1,
      ),
      replaysSessionSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
        0,
      ),
      replaysOnErrorSampleRate: parseSampleRate(
        import.meta.env.VITE_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE,
        1,
      ),
      normalizeDepth: 5,
      sendDefaultPii: false,
    });
  });
};

export const captureMonitoringException = (
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): void => {
  if (!monitoringEnabled) {
    return;
  }
  void getSentry().then((Sentry) => {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    });
  });
};

export const setMonitoringUser = (user: User | null): void => {
  if (!monitoringEnabled) {
    return;
  }
  void getSentry().then((Sentry) => {
    if (!user) {
      Sentry.setUser(null);
      return;
    }
    Sentry.setUser({
      id: String(user.id),
      username: user.usuario,
    });
    Sentry.setTag("role", user.role?.name ?? "unknown");
  });
};
