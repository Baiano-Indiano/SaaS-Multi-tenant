import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis for Edge resolution
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // 1. Local Testing Overrides (D-04)
  // Use x-mock-hostname to simulate custom domain behavior locally
  const mockHostname = request.headers.get('x-mock-hostname');
  const targetHostname = mockHostname || hostname;

  // 2. Define App Domains to exclude from rewrite
  // Replace with your actual production domain
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
  
  // If it's the main app domain, skip custom domain logic
  if (targetHostname === appDomain) {
    return NextResponse.next();
  }

  // 3. Custom Domain Resolution (DOM-03)
  const path = url.pathname;
  
  // Exclude internal Next.js paths and API routes
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/favicon.ico') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Check Redis for cached domain mapping
    // key: domain:acme.com -> value: { slug: "acme", id: "org_123" }
    const domainData = await redis.get<{ slug: string; id: string }>(`domain:${targetHostname}`);

    if (domainData) {
      // Internal rewrite to the organization route
      // The user sees acme.com/projects but internally it's /org/acme/projects
      console.log(`[Middleware] Rewriting ${targetHostname}${path} -> /org/${domainData.slug}${path}`);
      return NextResponse.rewrite(
        new URL(`/org/${domainData.slug}${path}`, request.url)
      );
    }
  } catch (error) {
    console.error('[Middleware] Domain resolution error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
