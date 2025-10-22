import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears auth cookies
 * Supabase SSR handles cookie deletion automatically via signOut()
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("=== [LOGOUT API] START ===");

  // Guard: Ensure request method is POST
  if (request.method !== "POST") {
    console.log("[LOGOUT API] ERROR: Method not POST");
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log incoming cookies for debugging
  const incomingCookies = request.headers.get("cookie");
  console.log("[LOGOUT API] Incoming cookies:", incomingCookies ? "YES" : "NO");
  if (incomingCookies) {
    // Log all cookie names (not values for security)
    const cookieNames = incomingCookies.split(";").map((c) => c.trim().split("=")[0]);
    console.log("[LOGOUT API] Cookie names:", cookieNames.join(", "));
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

  // Sign out the user - this should trigger cookie deletion via setAll() callback
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

  console.log("[LOGOUT API] signOut() completed");

  // Verify user is gone after signOut
  const { data: userAfter } = await supabase.auth.getUser();
  console.log("[LOGOUT API] User after signOut:", userAfter.user ? userAfter.user.email : "NONE");

  console.log("=== [LOGOUT API] SUCCESS ===");

  // Return redirect response instead of JSON
  // This ensures cookies are properly sent with Set-Cookie headers
  return redirect("/login", 303);
};
