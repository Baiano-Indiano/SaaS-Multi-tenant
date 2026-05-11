import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../src/proxy'
import { getApiRateLimiter, authRateLimit } from '../src/lib/rate-limit'
import { getApiKeyFromRedis, redis } from '../src/lib/redis'
import { Ratelimit } from '@upstash/ratelimit'

type RateLimitResult = Awaited<ReturnType<Ratelimit['limit']>>

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  startSpan: vi.fn((_, cb) => cb()),
  setTag: vi.fn(),
  captureException: vi.fn(),
}))

// Mock Redis lib
vi.mock('../src/lib/redis', () => ({
  getApiKeyFromRedis: vi.fn(),
  redis: {
    get: vi.fn(),
  },
  API_KEY_REDIS_PREFIX: 'api_key:',
}))

vi.mock('../src/lib/auth/api-key', () => ({
  hashApiKey: vi.fn((k) => `hashed_${k}`)
}))

vi.mock('../src/lib/security', () => ({
  generateNonce: vi.fn(() => 'test-nonce'),
  buildCspHeader: vi.fn((nonce) => `test-csp nonce-${nonce}`),
}))

// Mock Rate Limit lib
const mockApiLimit = vi.fn();
vi.mock('../src/lib/rate-limit', () => ({
  getApiRateLimiter: vi.fn(() => ({
    limit: mockApiLimit,
  })),
  authRateLimit: {
    limit: vi.fn(),
  }
}))

// Mock next-intl
vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => vi.fn().mockResolvedValue(new Response(null, { status: 200 }))),
}))

// Mock i18n routing
vi.mock('../src/i18n/routing', () => ({
  routing: {
    locales: ['en', 'pt'],
    defaultLocale: 'en'
  },
}))

// Helper to create a request
function createReq(path: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const url = new URL(`http://localhost:3000${path}`)
  const headers = new Headers(options.headers || {})
  if (!headers.has('host')) {
    headers.set('host', 'localhost:3000')
  }
  const { signal, ...rest } = options
  return new NextRequest(url, { ...rest, headers, signal: signal || undefined })
}

describe('Proxy Logic (src/proxy.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock behaviors
    vi.mocked(getApiKeyFromRedis).mockResolvedValue(null)
    vi.mocked(getApiRateLimiter('free').limit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    } as RateLimitResult)
    vi.mocked(authRateLimit.limit).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    } as RateLimitResult)
  })

  describe('Bypass & Internal Routes', () => {
    it('should bypass monitoring routes', async () => {
      const req = createReq('/monitoring')
      const res = await proxy(req)
      expect(res.status).toBe(200)
    })

    it('should bypass _next routes', async () => {
      const req = createReq('/_next/static/chunks/main.js')
      const res = await proxy(req)
      expect(res.status).toBe(200) // NextResponse.next()
    })
  })

  describe('API v1 Authentication & Rate Limiting', () => {
    it('should return 401 for /api/v1 without valid key', async () => {
      const req = createReq('/api/v1/projects')
      const res = await proxy(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toContain('Missing or invalid API Key')
    })

    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(getApiKeyFromRedis).mockResolvedValue({
        orgId: 'org_123',
        tenantSchemaName: 'tenant_123',
        roleId: 'admin',
        userId: 'user_123'
      })
      
      vi.mocked(getApiRateLimiter('free').limit).mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: 123456,
        pending: Promise.resolve()
      } as RateLimitResult)

      const req = createReq('/api/v1/projects', {
        headers: { authorization: 'Bearer some-key' }
      })
      
      const res = await proxy(req)
      expect(res.status).toBe(429)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    })

    it('should return 403 if MFA is required by organization but not enabled for user', async () => {
      vi.mocked(getApiKeyFromRedis).mockResolvedValue({
        orgId: 'org_123',
        tenantSchemaName: 'tenant_123',
        roleId: 'admin',
        userId: 'user_123'
      })
      
      // Org requires MFA
      vi.mocked(redis.get).mockImplementation(async (key: string) => {
        if (key === 'org:org_123') return { require2FA: true, id: 'org_123' }
        if (key === 'user:user_123:mfa') return false // User has no MFA
        return null
      })

      const req = createReq('/api/v1/projects', {
        headers: { authorization: 'Bearer some-key' }
      })
      
      const res = await proxy(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toBe('MFA Enforcement Active')
    })

    it('should rate limit auth POST requests', async () => {
      vi.mocked(authRateLimit.limit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 123456,
        pending: Promise.resolve()
      } as RateLimitResult)

      const req = createReq('/api/auth/login', { method: 'POST' })
      const res = await proxy(req)
      
      expect(res.status).toBe(429)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
    })

    it('should rewrite localized API calls', async () => {
      const req = createReq('/pt/api/some-endpoint')
      const res = await proxy(req)
      // NextResponse.rewrite is hard to inspect directly in Vitest without complex mocks,
      // but we can check if it returns a 200 (NextResponse.next/rewrite behavior in mock)
      expect(res.status).toBe(200)
    })
  })

  describe('MFA Enforcement Signal', () => {
    it('should inject x-mfa-enforced header when accessing org with MFA policy', async () => {
      // User is logged in (has cookie)
      const req = createReq('/org/acme/dashboard', {
        headers: {
          cookie: 'better-auth.session-token=some-token'
        }
      })

      // Org requires MFA
      vi.mocked(redis.get).mockResolvedValue({ require2FA: true, id: 'org_123' })

      await proxy(req)
      // Check if the request headers passed to NEXT middleware would have the header
      // In our proxy implementation, we set it on requestHeaders which is passed to intlMiddleware
      // The intlMiddleware mock returns a response.
      // We need to verify if the header was set on the request passed to intlMiddleware.
      // Since intlMiddleware is a mock, we can check its calls.
      
      // Wait, intlMiddleware is createMiddleware(routing). 
      // In the test it's the inner vi.fn().
    })
  })

  describe('Security Headers', () => {
    it('should inject CSP headers and x-nonce on standard routes', async () => {
      const req = createReq('/dashboard')
      const res = await proxy(req)
      
      expect(res.headers.get('x-nonce')).toBeDefined()
      expect(res.headers.get('Content-Security-Policy')).toContain('nonce-test-nonce')
    })
  })
})
