// Legacy client config — kept for backward compatibility.
// Primary client initialization is now in src/instrumentation-client.ts (Next.js 16 convention).
// This file is imported by sentry.client.config.ts convention but the new
// instrumentation-client.ts takes precedence in Next.js 16+.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://587a2877abe839366aa96a2c87698b93@o4511321072795648.ingest.us.sentry.io/4511321076727808",

  // Performance: sample 10% in prod
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // LGPD/GDPR: NEVER send default PII
  sendDefaultPii: false,

  // Replay with aggressive masking
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // PII scrubbing
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
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
