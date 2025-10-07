import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes
const isPublicPageRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);
const isPublicApiRoute = createRouteMatcher([
  '/api/chat(.*)',
  '/api/plan(.*)',
  '/api/event(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Never redirect API calls; they should return JSON
  if (isPublicApiRoute(req)) {
    return;
  }

  // If user is signed in and trying to access public page routes (except root), redirect to calendar
  if (userId && isPublicPageRoute(req) && pathname !== '/') {
    return Response.redirect(new URL('/task', req.url));
  }

  // Protect non-public page routes
  if (!isPublicPageRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};