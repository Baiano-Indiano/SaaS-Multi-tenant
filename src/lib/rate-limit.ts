import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

/**
 * Rate Limiter for standard API endpoints (/api/v1/*)
 * 100 requests per minute
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

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
