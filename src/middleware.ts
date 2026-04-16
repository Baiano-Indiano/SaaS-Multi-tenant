import { betterFetch } from '@better-fetch/fetch';
import type { Session } from 'better-auth/types';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    '/api/auth/get-session',
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    }
  );

  // Auth gate: unauthenticated users go to /login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tenant boundary enforcement (D-04)
  // The Server layout at /org/[orgSlug]/layout.tsx performs the full DB membership
  // check — it redirects to /selecionar-org for non-members (T-02, T-05).
  // Middleware stays lightweight (Edge-compatible): auth check only.
  // This is the recommended Next.js App Router pattern for tenant isolation.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/org/:path*',
    '/selecionar-org',
  ],
};
