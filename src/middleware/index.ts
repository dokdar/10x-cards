import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Public paths - accessible to all users (authenticated and unauthenticated)
 * Includes auth pages and their API endpoints
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/update-password',
  '/api/auth/logout',
];

/**
 * Protected paths - require authentication
 * Unauthenticated users will be redirected to /login
 */
const PROTECTED_PATHS = ["/generate", "/review"];

/**
 * Middleware for authentication and authorization
 * Runs on every request to:
 * 1. Check and restore user session from JWT cookie
 * 2. Redirect unauthenticated users from protected routes
 * 3. Redirect authenticated users from public auth pages
 * 4. Attach Supabase client to context for use in routes
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip middleware for static assets and images
  if (url.pathname.startsWith("/_astro/") || url.pathname.startsWith("/public/")) {
    return next();
  }

  // Create server-side Supabase client with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach Supabase client to context for use in API routes
  locals.supabase = supabase;

  // Retrieve current user session from JWT in cookies
  // This handles automatic token refresh via @supabase/ssr
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Debug logging for session status
  console.log(`[MIDDLEWARE] Path: ${url.pathname}`);
  console.log(`[MIDDLEWARE] User session: ${user ? `${user.email}` : 'NONE'}`);

  // If session exists, attach user info to locals
  // This makes user data available in .astro pages and API routes
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email || "",
      aud: user.aud,
    };
    console.log(`[MIDDLEWARE] User attached to locals: ${user.email}`);
  } else {
    console.log(`[MIDDLEWARE] No user session found`);
  }

  // === REDIRECT LOGIC ===

  // 1. Redirect authenticated users away from auth pages
  //    EXCEPT /reset-password (needed for password reset flow with recovery session)
  //    Skip API endpoints - let them execute without redirect interference
  if (user && PUBLIC_PATHS.includes(url.pathname) && !url.pathname.startsWith('/api/')) {
    // Allow access to /reset-password even for authenticated users (recovery flow)
    if (url.pathname === '/reset-password') {
      console.log('[MIDDLEWARE] Allowing authenticated user to access /reset-password (recovery flow)');
      return next();
    }
    return redirect("/");
  }

  // 2. Redirect unauthenticated users from protected routes
  //    (e.g., trying to access /generate without being logged in)
  if (!user) {
    const isProtected = PROTECTED_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));

    if (isProtected) {
      return redirect("/login");
    }
  }

  // Continue with request
  return next();
});
