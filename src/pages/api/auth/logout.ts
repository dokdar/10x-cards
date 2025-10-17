import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears auth cookies
 * On server-side, we need to manually clear cookies after signOut
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("=== [LOGOUT API] START ===");

  // Guard: Ensure request method is POST
  if (request.method !== "POST") {
    console.log("[LOGOUT API] ERROR: Method not POST");
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log incoming cookies
  const incomingCookies = request.headers.get("cookie");
  console.log("[LOGOUT API] Incoming cookies header:", incomingCookies ? "YES" : "NO");
  if (incomingCookies) {
    console.log("[LOGOUT API] Cookie content:", incomingCookies.substring(0, 100) + "...");
  }

  // Create server-side Supabase client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  console.log("[LOGOUT API] Supabase client created");

  // Check user BEFORE signOut
  const { data: userBefore } = await supabase.auth.getUser();
  console.log("[LOGOUT API] User before signOut:", userBefore.user ? userBefore.user.email : "NONE");

  // Sign out the user
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[LOGOUT API] ERROR in signOut:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to sign out",
        details: error.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log("[LOGOUT API] SignOut successful");

  // Check user AFTER signOut
  const { data: userAfter } = await supabase.auth.getUser();
  console.log("[LOGOUT API] User after signOut:", userAfter.user ? userAfter.user.email : "NONE");

  // Try to get all cookies that were set
  console.log("[LOGOUT API] Manually clearing cookies...");
  
  // List of all possible Supabase auth cookie names
  const cookieNames = [
    'sb-auth-token',
    'sb-access-token', 
    'sb-refresh-token',
    'sb-session',
    'sb_jwt_token',
    'sb_refresh_token',
  ];

  cookieNames.forEach((name) => {
    console.log(`[LOGOUT API] Deleting cookie: ${name}`);
    cookies.delete(name, { path: '/' });
  });

  console.log("[LOGOUT API] Cookies delete called");

  // Verify user is gone
  const { data: userFinal } = await supabase.auth.getUser();
  console.log("[LOGOUT API] User after cookie delete:", userFinal.user ? userFinal.user.email : "NONE");

  console.log("=== [LOGOUT API] SUCCESS ===");

  // Success: Cookies are cleared
  return new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
