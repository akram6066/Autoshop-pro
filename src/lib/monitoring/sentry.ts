import * as Sentry from "@sentry/nextjs";

export function captureException(err: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(err, { extra: context });
}

export function setSentryUser(id: string) {
  Sentry.setUser({ id });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}