export { proxy as default } from './proxy';

export const config = {
  // Matcher for everything except internal Next.js paths and static assets
  matcher: ['/((?!_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
