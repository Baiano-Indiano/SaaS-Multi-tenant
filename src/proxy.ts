import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import * as Sentry from '@sentry/nextjs';
import { routing } from './i18n/routing';
import { redis, getApiKeyFromRedis } from './lib/redis';
import type { ApiKeyData } from './lib/redis';
import { hashApiKey } from './lib/auth/api-key';
import { getApiRateLimiter, authRateLimit } from './lib/rate-limit';
import { generateNonce, buildCspHeader } from './lib/security';
import { l1Cache } from './lib/cache/l1-cache';
import { incrementUsage } from './lib/billing/telemetry';

const intlMiddleware = createMiddleware(routing);

const html503 = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Temporarily Unavailable</title>
    <style>
        body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 480px;
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            color: #a1a1aa;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #f4f4f5;
        }
        p {
            font-size: 0.95rem;
            color: #a1a1aa;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }
        .retry-btn {
            display: inline-block;
            background-color: #27272a;
            color: #f4f4f5;
            padding: 0.6rem 1.2rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            text-decoration: none;
            font-weight: 500;
            border: 1px solid #3f3f46;
            transition: background-color 0.2s;
        }
        .retry-btn:hover {
            background-color: #3f3f46;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔒</div>
        <h1>Security Check Unavailable</h1>
        <p>We are temporarily unable to verify security policies for this request. Please refresh the page or try again in a few moments.</p>
        <a href="" class="retry-btn" onclick="window.location.reload(); return false;">Try Again</a>
    </div>
</body>
</html>
`;

/**
 * Proxy / Middleware (Next.js 16 Proxy Convention)
 * 
 * Handles:
 * 1. API v1 Authentication (Bearer Token via Redis)
 * 2. Custom Domain Resolution (Hostname via Redis)
 * 3. Internationalization (next-intl)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Security: Generate unique nonce for CSP
  const nonce = generateNonce();
  
  // Initialize headers and set x-pathname for layout-based checks
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-nonce', nonce);

  // --- 0. Bypass internal and public health routes ---
  const isMonitoring = pathname === '/monitoring' || pathname.match(/^\/[a-z]{2}\/monitoring/);
  const isPublicHealth = pathname === '/api/v1/health';

  if (isMonitoring || isPublicHealth || pathname.startsWith('/_next')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // --- 1. API v1 Authentication Interceptor ---
  if (pathname.startsWith('/api/v1')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid API Key. Expected "Authorization: Bearer <key>"' }, 
        { status: 401 }
      );
    }

    const rawKey = authHeader.split(' ')[1];
    
    try {
      return await Sentry.startSpan(
        { name: 'proxy.api-key-auth', op: 'http.proxy', attributes: { 'proxy.flow': 'api-v1-auth' } },
        async () => {
          const hashedKey = await hashApiKey(rawKey);
          const cacheKey = `api_key:${hashedKey}`;
          let keyData = l1Cache.get<ApiKeyData | null>(cacheKey);
          if (keyData === undefined) {
            keyData = await getApiKeyFromRedis(hashedKey);
            l1Cache.set(cacheKey, keyData);
          }

          if (!keyData) {
            return NextResponse.json({ error: 'Invalid or expired API Key' }, { status: 401 });
          }

          // Scope Validation (Simplified Model: Read / Write)
          // Default to ["read", "write"] for legacy keys if scopes field is missing
          const scopes = keyData.scopes || ["read", "write"];
          const method = request.method;
          const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

          if (isWriteMethod && !scopes.includes("write")) {
            return NextResponse.json(
              { error: "Forbidden", message: "This API Key does not have 'write' permissions." }, 
              { status: 403 }
            );
          }

          if (!scopes.includes("read")) {
             return NextResponse.json(
              { error: "Forbidden", message: "This API Key does not have 'read' permissions." }, 
              { status: 403 }
            );
          }

          // Fetch Organization Data (MFA and Billing/Plan context)
          let orgData: { require2FA: boolean; id: string; plan?: string } | null = null;
          try {
            const orgCacheKey = `org:${keyData.orgId}`;
            const cachedOrg = l1Cache.get<{ require2FA: boolean; id: string; plan?: string } | null>(orgCacheKey);
            if (cachedOrg !== undefined) {
              orgData = cachedOrg;
            } else {
              orgData = await redis.get<{ require2FA: boolean; id: string; plan?: string }>(orgCacheKey);
              l1Cache.set(orgCacheKey, orgData);
            }
          } catch (e) {
            Sentry.captureException(e as Error, { tags: { 'proxy.flow': 'api-org-redis-failure' } });
            console.error('[Proxy] Redis org fetch failed during proxy API auth check:', e);
            return NextResponse.json(
              { error: 'Service Unavailable', message: 'Security check unavailable (Redis down)' },
              { status: 503 }
            );
          }

          // Tenant-Aware API Rate Limiting (Billing-Aware)
          const identifier = `org_${keyData.orgId}`;
          const resolvedPlan = orgData?.plan || keyData.plan || 'free';
          const limiter = getApiRateLimiter(resolvedPlan);
          const { success, limit, remaining, reset } = await limiter.limit(identifier);

          if (!success) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              {
                status: 429,
                headers: {
                  'X-RateLimit-Limit': limit.toString(),
                  'X-RateLimit-Remaining': remaining.toString(),
                  'X-RateLimit-Reset': reset.toString(),
                },
              }
            );
          }

          let isUserMfaEnabled = false;
          if (orgData?.require2FA) {
            try {
              const userMfaCacheKey = `user:${keyData.userId}:mfa`;
              const cachedMfa = l1Cache.get<boolean>(userMfaCacheKey);
              if (cachedMfa !== undefined) {
                isUserMfaEnabled = cachedMfa || false;
              } else {
                const fetchedMfa = await redis.get<boolean>(userMfaCacheKey);
                isUserMfaEnabled = fetchedMfa || false;
                l1Cache.set(userMfaCacheKey, fetchedMfa);
              }
            } catch (e) {
              Sentry.captureException(e as Error, { tags: { 'proxy.flow': 'api-mfa-user-redis-failure' } });
              console.error('[Proxy] Redis user MFA fetch failed during MFA check:', e);
              return NextResponse.json(
                { error: 'Service Unavailable', message: 'Security check unavailable (Redis down)' },
                { status: 503 }
              );
            }

            if (!isUserMfaEnabled) {
              return NextResponse.json(
                { 
                  error: 'MFA Enforcement Active',
                  message: 'This organization requires Two-Factor Authentication. Please enable MFA on your account to use API keys.',
                  setupUrl: `${request.nextUrl.origin}/account/security`
                }, 
                { status: 403 }
              );
            }
          }

          // Set tenant context for Sentry breadcrumbs (UUID only, no PII)
          Sentry.setTag('tenant.id', keyData.orgId);

          requestHeaders.set('x-tenant-id', keyData.orgId);
          requestHeaders.set('x-tenant-schema', keyData.tenantSchemaName);
          requestHeaders.set('x-role-id', keyData.roleId);

          // Track API usage asynchronously without blocking the request path
          incrementUsage(keyData.orgId, 'api_calls').catch((err) => {
            console.error('[Proxy] Telemetry tracking failed:', err);
          });

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }
      );
    } catch (error) {
      Sentry.captureException(error, { tags: { 'proxy.flow': 'api-v1-auth' } });
      console.error('[Proxy] API Key validation error:', error);
      return NextResponse.json({ error: 'Internal Server Error during validation' }, { status: 500 });
    }
  }

  // --- 2. Custom Domain Resolution (DOM-03) ---
  
  // Use x-mock-hostname to simulate custom domain behavior locally
  const mockHostname = request.headers.get('x-mock-hostname');
  const targetHostname = mockHostname || hostname;

  // Define App Domains to exclude from rewrite
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
  
  // If it's NOT the main app domain, try custom domain logic
  if (targetHostname !== appDomain) {
    // Exclude internal Next.js paths
    if (
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/api') && 
      !pathname.startsWith('/favicon.ico') &&
      !pathname.includes('.')
    ) {
      try {
        const domainResponse = await Sentry.startSpan(
          { name: 'proxy.domain-resolution', op: 'http.proxy', attributes: { 'proxy.hostname': targetHostname } },
          async () => {
            const domainCacheKey = `domain:${targetHostname}`;
            let domainData = l1Cache.get<{ slug: string; id: string } | null>(domainCacheKey);
            if (domainData === undefined) {
              domainData = await redis.get<{ slug: string; id: string }>(domainCacheKey);
              l1Cache.set(domainCacheKey, domainData);
            }

            if (domainData) {
              Sentry.setTag('tenant.slug', domainData.slug);
              const rwResponse = NextResponse.rewrite(
                new URL(`/org/${domainData.slug}${pathname}`, request.url),
                {
                  request: {
                    headers: requestHeaders,
                  },
                }
              );
              rwResponse.headers.set('Content-Security-Policy', buildCspHeader(nonce));
              rwResponse.headers.set('x-nonce', nonce);
              return rwResponse;
            }
            return null;
          }
        );
        
        if (domainResponse) return domainResponse;
      } catch (error) {
        Sentry.captureException(error, { tags: { 'proxy.flow': 'domain-resolution' } });
        console.error('[Proxy] Domain resolution error:', error);
      }
    }
  }

  // --- 3. MFA Enforcement (Wave 5) ---
  // We only enforce 2FA if the user is attempting to access an organization context
  if (
    pathname.includes('/org/') && 
    !pathname.includes('/setup-2fa') &&
    !pathname.includes('/login') &&
    !pathname.includes('/api/auth')
  ) {
    try {
      // In Next.js 16 Proxy, we can't easily call auth.api.getSession due to internal fetch limitations
      // However, we can check for the presence of the session cookie as a first line of defense
      const hasSessionCookie = request.cookies.has('better-auth.session-token') || 
                               request.cookies.has('__Secure-better-auth.session-token');

      if (hasSessionCookie) {
        // Extract org slug from pathname: /pt/org/my-org/dashboard or /org/my-org/dashboard
        const segments = pathname.split('/').filter(Boolean);
        let orgSlug = '';
        
        // Handle localized vs non-localized slugs
        if ((routing.locales as readonly string[]).includes(segments[0])) {
          if (segments[1] === 'org') orgSlug = segments[2];
        } else {
          if (segments[0] === 'org') orgSlug = segments[1];
        }

        if (orgSlug) {
          // Check Redis for org policy (much faster than DB in proxy)
          let orgData: { require2FA: boolean; id: string } | null = null;
          try {
            const orgCacheKey = `org:${orgSlug}`;
            const cachedOrg = l1Cache.get<{ require2FA: boolean; id: string } | null>(orgCacheKey);
            if (cachedOrg !== undefined) {
              orgData = cachedOrg;
            } else {
              orgData = await redis.get<{ require2FA: boolean; id: string }>(orgCacheKey);
              l1Cache.set(orgCacheKey, orgData);
            }
          } catch (e) {
            Sentry.captureException(e as Error, { tags: { 'proxy.flow': 'web-mfa-org-redis-failure' } });
            console.error('[Proxy] Redis org policy fetch failed for slug:', orgSlug, e);
            return new NextResponse(html503, {
              status: 503,
              headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Security-Policy': buildCspHeader(nonce),
                'x-nonce': nonce
              }
            });
          }
          
          if (orgData?.require2FA) {
            // Check if user has 2FA enabled in their user record
            // Since we can't easily get the session here without performance hit,
            // we'll rely on a lightweight session metadata check or simply let 
            // the layout handle the final redirect, BUT we set a header 
            // to signal enforcement is active.
            requestHeaders.set('x-mfa-enforced', 'true');
            
            // To prevent ANY data leakage in the proxy, we can perform a quick 
            // session check via better-auth internal cookie structure if available,
            // but the most reliable way in Proxy is to signal the app.
            // HOWEVER, for "Industrial Grade", we should block here if we can.
          }
        }
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { 'proxy.flow': 'mfa-enforcement' } });
      console.error('[Proxy] MFA Enforcement error:', error);
    }
  }

  // --- 4. Internationalization (next-intl) ---
  // Skip i18n for API routes to avoid prefixing them (e.g., /pt/api/auth)
  const isLocalizedApi = /^\/(en|pt)\/api/.test(pathname);
  
  if (pathname.startsWith('/api') || isLocalizedApi) {
    if (isLocalizedApi) {
      const newPathname = pathname.replace(/^\/(en|pt)/, '');
      console.log(`[Proxy] Rewriting localized API call: ${pathname} -> ${newPathname}`);
      return NextResponse.rewrite(new URL(newPathname, request.url), {
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Optimization: Skip request cloning for auth and connector routes to prevent internal context loss
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/connectors')) {
      console.log(`[Proxy-Auth] ${request.method} ${pathname} Cookies:`, request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`));
      if (pathname.startsWith('/api/auth') && request.method === 'POST') {
        const { success, limit, remaining, reset } = await authRateLimit.limit(`ip_${ip}`);
        if (!success) {
          return NextResponse.json(
            { error: 'Too many login attempts' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          );
        }
      }

      return NextResponse.next();
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For standard app routes, run the i18n middleware
  const response = await intlMiddleware(request);

  // --- 5. Security Headers (CSP Hardening) ---
  // Inject CSP and Nonce headers into all document responses
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce));
  response.headers.set('x-nonce', nonce);

  return response;
}

// Next.js 16 Proxy Config
export const config = {
  // Matcher for everything except internal Next.js paths and static assets
  // This combines patterns from both old middleware and new proxy conventions
  matcher: ['/((?!_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
