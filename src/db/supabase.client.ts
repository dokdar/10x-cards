import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// Mock user ID for development (before authentication is implemented)
export const DEFAULT_USER_ID = "c7261d9f-2ce7-451b-aaad-e81ebb81e2d6";

// =============================================================================
// SERVER-SIDE SUPABASE CLIENT FOR AUTH
// =============================================================================

/**
 * Cookie options for server-side auth session management
 * Following Supabase best practices for security
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true, // HTTPS only in production
  httpOnly: true, // Prevent XSS attacks
  sameSite: "lax", // CSRF protection
};

/**
 * Parse cookie header into array of { name, value } pairs
 * Helper function for getAll() in server client
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create a Supabase server instance for server-side auth operations
 * This is used in middleware and API routes for secure auth handling
 *
 * @param context Object containing headers and cookies from Astro context
 * @returns Configured Supabase client for server-side use
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      // getAll is called to retrieve all cookies from the request
      // This includes auth tokens set by Supabase
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      // setAll is called to set new cookies in the response
      // This is how Supabase updates auth tokens
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
