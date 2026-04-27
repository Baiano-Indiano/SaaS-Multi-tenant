import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { redis } from '@/lib/redis';
import { getApiKeyFromRedis } from '@/lib/redis';
import { hashApiKey } from '@/lib/auth/api-key';

const intlMiddleware = createMiddleware(routing);

/**
 * Proxy / Middleware (Next.js 16 Proxy Convention)
 * 
 * Handles:
 * 1. API v1 Authentication (Bearer Token via Redis)
 * 2. Custom Domain Resolution (Hostname via Redis)
 * 3. Internationalization (next-intl)
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Initialize headers and set x-pathname for layout-based checks
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

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
      const hashedKey = await hashApiKey(rawKey);
      const keyData = await getApiKeyFromRedis(hashedKey);

      if (!keyData) {
        return NextResponse.json({ error: 'Invalid or expired API Key' }, { status: 401 });
      }

      requestHeaders.set('x-tenant-id', keyData.orgId);
      requestHeaders.set('x-tenant-schema', keyData.tenantSchemaName);
      requestHeaders.set('x-role-id', keyData.roleId);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
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
  
  // If it's the main app domain, skip custom domain logic
  if (targetHostname === appDomain) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Exclude internal Next.js paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  try {
    // Check Redis for cached domain mapping
    const domainData = await redis.get<{ slug: string; id: string }>(`domain:${targetHostname}`);

    if (domainData) {
      console.log(`[Proxy] Rewriting ${targetHostname}${pathname} -> /org/${domainData.slug}${pathname}`);
      return NextResponse.rewrite(
        new URL(`/org/${domainData.slug}${pathname}`, request.url),
        {
          request: {
            headers: requestHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error('[Proxy] Domain resolution error:', error);
  }

  // --- 3. Internationalization (next-intl) ---
  // For standard app routes, run the i18n middleware
  return intlMiddleware(request);
}

// Next.js 16 Proxy Config
export const config = {
  // Matcher for everything except internal Next.js paths and static assets
  // This combines patterns from both old middleware and new proxy conventions
  matcher: ['/((?!_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
