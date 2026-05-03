// Sentry Edge Runtime Configuration
// CRITICAL config for proxy.ts monitoring.
// All tenant resolution, API key validation, and MFA enforcement
// flows through the Edge runtime via proxy.ts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://587a2877abe839366aa96a2c87698b93@o4511321072795648.ingest.us.sentry.io/4511321076727808",

  // Higher sample rate for edge — proxy latency is our #1 performance concern
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Enable structured logs
  enableLogs: true,

  // LGPD/GDPR: NEVER send default PII
  sendDefaultPii: false,

  // PII scrubbing for edge events
  beforeSend(event) {
    // Strip cookies — contain better-auth session tokens
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Scrub auth headers
    if (event.request?.headers) {
      const sensitiveHeaders = ["authorization", "cookie", "set-cookie"];
      for (const header of sensitiveHeaders) {
        if (event.request.headers[header]) {
          event.request.headers[header] = "[REDACTED]";
        }
      }
    }

    // Preserve only UUID-based user identity
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
