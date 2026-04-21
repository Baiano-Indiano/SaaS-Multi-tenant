import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Auth gate: unauthenticated users go to /login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tenant boundary enforcement (D-04)
  // The Server layout at /org/[orgSlug]/layout.tsx performs the full DB membership
  // check — it redirects to /selecionar-org for non-members (T-02, T-05).
  // Proxy stays lightweight: auth check only via direct server client.
  // This is the optimized Next.js App Router pattern for tenant isolation.
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
