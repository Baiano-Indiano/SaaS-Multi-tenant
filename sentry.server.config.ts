// Sentry Server Configuration
// Handles Node.js runtime (API Routes, Server Actions)
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://587a2877abe839366aa96a2c87698b93@o4511321072795648.ingest.us.sentry.io/4511321076727808",

  // Performance: sample 10% in prod, 100% in dev for debugging
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable structured logs
  enableLogs: true,

  // LGPD/GDPR: NEVER send default PII
  sendDefaultPii: false,

  // Aggressive PII scrubbing before data leaves our infrastructure
  beforeSend(event) {
    return scrubSensitiveData(event);
  },

  environment: process.env.NODE_ENV,
});

/**
 * Scrub PII from Sentry events before they leave the server.
 * 
 * Removes: emails, passwords, auth tokens, IP addresses.
 * Preserves: tenantId, userId (UUIDs only) for debugging.
 */
function scrubSensitiveData(event: Sentry.ErrorEvent) {
  // Strip cookies entirely — they contain better-auth session tokens
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  // Scrub authorization headers
  if (event.request?.headers) {
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "set-cookie",
      "x-forwarded-for",
    ];
    for (const header of sensitiveHeaders) {
      if (Reflect.has(event.request.headers, header)) {
        Reflect.set(event.request.headers, header, "[REDACTED]");
      }
    }
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
          const sanitized: Record<string, unknown> = Object.create(null);
          for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
              continue;
            }
            const lowerKey = key.toLowerCase();
            if (sensitiveKeywords.some(kw => lowerKey.includes(kw))) {
              Reflect.set(sanitized, key, "[REDACTED]");
            } else {
              Reflect.set(sanitized, key, scrub(value));
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

  // Scrub user PII — keep only UUID id
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  return event;
}
