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
};

/**
 * Returns the appropriate rate limiter based on the plan ID.
 * Defaults to the free tier limiter if the plan is unknown.
 */
export function getApiRateLimiter(planId: string = 'free') {
  return tierLimiters[planId as keyof typeof tierLimiters] || tierLimiters.free;
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
