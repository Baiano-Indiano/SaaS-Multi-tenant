import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import * as Sentry from '@sentry/nextjs';
import { routing } from './i18n/routing';
import { redis, getApiKeyFromRedis } from './lib/redis';
import { hashApiKey } from './lib/auth/api-key';
import { apiRateLimit, authRateLimit } from './lib/rate-limit';
import { generateNonce, buildCspHeader } from './lib/security';

const intlMiddleware = createMiddleware(routing);

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

  // --- 0. Bypass internal routes (Sentry tunnel, Next.js internals) ---
  const isMonitoring = pathname === '/monitoring' || pathname.match(/^\/[a-z]{2}\/monitoring/);
  if (isMonitoring || pathname.startsWith('/_next')) {
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
          const keyData = await getApiKeyFromRedis(hashedKey);

          if (!keyData) {
            return NextResponse.json({ error: 'Invalid or expired API Key' }, { status: 401 });
          }

          // Tenant-Aware API Rate Limiting
          const identifier = `org_${keyData.orgId}`;
          const { success, limit, remaining, reset } = await apiRateLimit.limit(identifier);

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

          // Industrial MFA Enforcement for API (W5)
          const orgData = await redis.get<{ require2FA: boolean; id: string }>(`org:${keyData.orgId}`);
          if (orgData?.require2FA) {
            const isUserMfaEnabled = await redis.get<boolean>(`user:${keyData.userId}:mfa`);

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
        return await Sentry.startSpan(
          { name: 'proxy.domain-resolution', op: 'http.proxy', attributes: { 'proxy.hostname': targetHostname } },
          async () => {
            const domainData = await redis.get<{ slug: string; id: string }>(`domain:${targetHostname}`);

            if (domainData) {
              Sentry.setTag('tenant.slug', domainData.slug);
              return NextResponse.rewrite(
                new URL(`/org/${domainData.slug}${pathname}`, request.url),
                {
                  request: {
                    headers: requestHeaders,
                  },
                }
              );
            }
            return null;
          }
        ) ?? undefined; // fall through if no domain match
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
          const orgData = await redis.get<{ require2FA: boolean; id: string }>(`org:${orgSlug}`);
          
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

    // Optimization: Skip request cloning for auth routes to prevent internal Better Auth context loss
    if (pathname.startsWith('/api/auth')) {
      if (request.method === 'POST') {
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

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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
  response.headers.set('Content-Security-Policy-Report-Only', buildCspHeader(nonce));
  response.headers.set('x-nonce', nonce);

  return response;
}

// Next.js 16 Proxy Config
export const config = {
  // Matcher for everything except internal Next.js paths and static assets
  // This combines patterns from both old middleware and new proxy conventions
  matcher: ['/((?!_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
