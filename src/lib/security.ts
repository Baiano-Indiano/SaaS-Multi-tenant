/**
 * Security Utilities & CSP Constants
 * 
 * Centralized configuration for Content Security Policy and 
 * infrastructure-level security headers.
 */

/**
 * Generates a cryptographically secure random nonce for CSP.
 * Optimized for edge runtimes (using Web Crypto API).
 */
export function generateNonce(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    // Fallback for environments where crypto is not globally available (rare in modern runtimes)
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(Array.from(array).map(b => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * CSP Domain Allowlist
 * Organize by directive for clarity.
 */
export const CSP_DOMAINS = {
  scripts: [
    'https://*.stripe.com',
    'https://*.sentry.io',
    'https://challenges.cloudflare.com', // If using Turnstile
  ],
  styles: [
    'https://fonts.googleapis.com',
  ],
  images: [
    'https://*.stripe.com',
    'https://*.sentry.io',
    'https://*.googleusercontent.com', // Avatars
    'https://avatars.githubusercontent.com', // Avatars
    'https://*.vercel-storage.com',
    'data:',
    'blob:',
  ],
  connect: [
    'https://*.stripe.com',
    'https://*.sentry.io',
    'https://*.vercel-storage.com',
  ],
  frames: [
    'https://*.stripe.com',
    'https://challenges.cloudflare.com',
  ],
};

/**
 * Sentry CSP Report-Only Endpoint
 * Derived from the project's DSN.
 */
export const SENTRY_REPORT_URI = 'https://o4511321072795648.ingest.us.sentry.io/api/4511321076727808/securityreport/?sentry_key=587a2877abe839366aa96a2c87698b93';

/**
 * Builds the CSP header string.
 * @param nonce The unique nonce for this request
 * @param isReportOnly Whether to use Report-Only mode
 */
export function buildCspHeader(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Keeping unsafe-inline for GSAP/Tailwind per decision
    `img-src 'self' ${CSP_DOMAINS.images.join(' ')}`,
    `connect-src 'self' ${CSP_DOMAINS.connect.join(' ')}`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `frame-src 'self' ${CSP_DOMAINS.frames.join(' ')}`,
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `report-uri ${SENTRY_REPORT_URI}`,
  ];

  return directives.join('; ');
}
