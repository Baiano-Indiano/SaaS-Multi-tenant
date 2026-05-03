import * as Sentry from "@sentry/nextjs";

/**
 * Next.js Instrumentation Hook
 * 
 * Registers Sentry SDK at the runtime level for both
 * Node.js (API Routes, Server Actions) and Edge (proxy.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Capture unhandled request errors and send to Sentry.
 * This is the official Next.js 16 hook for request-level error capture.
 */
export const onRequestError = Sentry.captureRequestError;
