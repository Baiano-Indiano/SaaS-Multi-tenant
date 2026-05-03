// Sentry Client-Side Instrumentation (Next.js 16 convention)
// Loaded via src/instrumentation-client.ts for browser-side error capture.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://587a2877abe839366aa96a2c87698b93@o4511321072795648.ingest.us.sentry.io/4511321076727808",

  // Performance: sample 10% in prod, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable structured logs
  enableLogs: true,

  // LGPD/GDPR: NEVER send default PII from browser
  sendDefaultPii: false,

  // Replay: capture 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Aggressive PII scrubbing — strip sensitive data before it leaves the browser
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Scrub any user PII except anonymous UUID
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }

    // Scrub request body for sensitive fields (deep scrub)
    if (event.request?.data && typeof event.request.data === "string") {
      try {
        const body = JSON.parse(event.request.data);
        const sensitiveKeywords = [
          "password", "token", "secret", "session",
          "backupcode", "webhook", "api_key", "apikey",
          "stripe", "payment", "card", "2fa", "mfa"
        ];
        
        const scrub = (obj: unknown): unknown => {
          if (Array.isArray(obj)) return obj.map(scrub);
          if (typeof obj === "object" && obj !== null) {
            const sanitized: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
              const lowerKey = key.toLowerCase();
              if (sensitiveKeywords.some(kw => lowerKey.includes(kw))) {
                sanitized[key] = "[REDACTED]";
              } else {
                sanitized[key] = scrub(value);
              }
            }
            return sanitized;
          }
          return obj;
        };
        
        event.request.data = JSON.stringify(scrub(body));
      } catch {
        // Not JSON, skip
      }
    }

    return event;
  },

  environment: process.env.NODE_ENV,
});

// Next.js 16 router transition tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
