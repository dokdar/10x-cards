import { defineMiddleware } from 'astro:middleware';

import { DEFAULT_USER_ID, supabaseClient } from '../db/supabase.client.ts';

/**
 * Middleware for Astro requests
 * - Attaches Supabase client to context.locals
 * - For development: Uses DEFAULT_USER_ID as mock user
 * - TODO: Implement proper authentication after MVP
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client to context
  context.locals.supabase = supabaseClient;

  // For API routes, attach mock user (development only)
  if (context.url.pathname.startsWith('/api/')) {
    // Use DEFAULT_USER_ID for development
    context.locals.user = {
      id: DEFAULT_USER_ID,
    } as any;
  }

  return next();
});
