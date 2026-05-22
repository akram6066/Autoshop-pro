// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b63bf2517e9544a50acf14e90b817f67@o4511360374013952.ingest.de.sentry.io/4511360380764240",

  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  enableLogs: true,

  sendDefaultPii: false,
});
