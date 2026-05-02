import { proxy } from './proxy';

/**
 * Next.js Middleware entry point
 * Re-exports the proxy function which handles all routing, auth, and i18n
 */
export default proxy;

export const config = {
  // Matcher for everything except internal Next.js paths and static assets
  matcher: ['/((?!_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
