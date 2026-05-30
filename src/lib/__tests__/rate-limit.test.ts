import { describe, it, expect, vi } from 'vitest';
import { getApiRateLimiter, tierLimiters } from '../rate-limit';
import { PLANS } from '../billing/plans';

// Mock Redis connection
vi.mock('../redis', () => ({
  redis: {},
}));

// Mock @upstash/ratelimit
vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    constructor(public config: any) {}
    limit = vi.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 1000,
    });
    static slidingWindow = vi.fn().mockReturnValue('sliding-window-mock');
  }

  return {
    Ratelimit,
  };
});

describe('Billing-Aware Rate Limiting', () => {
  it('should map plans to the correct rate limits', () => {
    expect(PLANS.FREE.rateLimit).toBe(600);
    expect(PLANS.STARTER.rateLimit).toBe(3000);
    expect(PLANS.PRO.rateLimit).toBe(6000);
    expect(PLANS.ENTERPRISE.rateLimit).toBe(30000);
  });

  it('should return the correct limiter for each plan', () => {
    const freeLimiter = getApiRateLimiter('free');
    const starterLimiter = getApiRateLimiter('starter');
    const proLimiter = getApiRateLimiter('pro');
    const enterpriseLimiter = getApiRateLimiter('enterprise');

    expect(freeLimiter).toBe(tierLimiters.free);
    expect(starterLimiter).toBe(tierLimiters.starter);
    expect(proLimiter).toBe(tierLimiters.pro);
    expect(enterpriseLimiter).toBe(tierLimiters.enterprise);
  });

  it('should fallback to free tier for unknown or empty plans', () => {
    const nullLimiter = getApiRateLimiter(undefined);
    const unknownLimiter = getApiRateLimiter('unknown-plan');
    const protoLimiter = getApiRateLimiter('__proto__');

    expect(nullLimiter).toBe(tierLimiters.free);
    expect(unknownLimiter).toBe(tierLimiters.free);
    expect(protoLimiter).toBe(tierLimiters.free);
  });
});
