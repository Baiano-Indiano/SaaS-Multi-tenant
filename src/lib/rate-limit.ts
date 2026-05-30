import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';
import { PLANS } from './billing/plans';

/**
 * Tiered Rate Limiters for API endpoints (/api/v1/*)
 * Each tier has its own limiter instance for accurate analytics and isolation.
 */
export const tierLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PLANS.FREE.rateLimit, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:free',
  }),
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PLANS.STARTER.rateLimit, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:starter',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PLANS.PRO.rateLimit, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:pro',
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PLANS.ENTERPRISE.rateLimit, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:enterprise',
  }),
};

/**
 * Returns the appropriate rate limiter based on the plan ID.
 * Defaults to the free tier limiter if the plan is unknown.
 */
export function getApiRateLimiter(planId: string = 'free') {
  if (planId === "__proto__" || planId === "constructor" || planId === "prototype") {
    return tierLimiters.free;
  }
  return (Reflect.get(tierLimiters, planId) as typeof tierLimiters.free) || tierLimiters.free;
}

/**
 * Rate Limiter for Authentication endpoints (/api/auth/*)
 * 10 requests per minute
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// ─── Server Action Rate Limiters ───────────────────────────────────────────
// These protect critical mutation actions from abuse at the application layer.

/**
 * Organization creation: 3 per hour per user.
 * Prevents mass-creation of tenant schemas.
 */
export const orgCreateRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:org_create',
});

/**
 * Member invitations: 20 per hour per user.
 * Prevents invitation spam.
 */
export const memberInviteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:member_invite',
});

/**
 * Security-sensitive operations (2FA toggle, session revocation): 10 per 15 minutes.
 */
export const securityActionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  analytics: true,
  prefix: 'ratelimit:action:security',
});

/**
 * Domain actions (add, remove, verify): 10 per hour.
 * Prevents spamming domain checks and additions.
 */
export const domainActionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:domain',
});

/**
 * SSO configuration changes: 10 per hour.
 * Prevents rapid toggling or brute forcing config endpoints.
 */
export const ssoActionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:sso',
});

/**
 * API Key actions (create, delete): 20 per hour.
 * Prevents rapid generation of API keys.
 */
export const apiKeyActionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:api_key',
});

/**
 * Webhook/Connector actions (create, update, delete): 20 per hour.
 * Prevents spamming webhook configurations.
 */
export const webhookActionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:action:webhook',
});

/**
 * Helper to enforce rate limiting in a Server Action.
 * Throws a user-friendly error if the limit is exceeded.
 */
export async function enforceRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<void> {
  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(
      `Muitas requisições. Tente novamente em ${retryAfterSeconds} segundos.`
    );
  }
}
