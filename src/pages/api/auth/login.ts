import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/validation/auth.schema";
import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password
 * Returns user object on success, error on failure
 * Supabase automatically sets auth cookies in the response
 */
export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  // Guard: Ensure request method is POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Guard: Prevent already authenticated users from logging in again
  if (locals.user) {
    return new Response(JSON.stringify({ error: "Jesteś już zalogowany" }), { status: 403 });
  }

  // Guard: Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  // Guard: Validate input against schema
  const validationResult = loginSchema.safeParse(body);
  if (!validationResult.success) {
    // Map Zod errors to user-friendly messages
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    let userMessage = "Walidacja nie powiodła się";

    // Get the first error message from any field
    if (fieldErrors.email && fieldErrors.email[0]) {
      userMessage = fieldErrors.email[0];
    } else if (fieldErrors.password && fieldErrors.password[0]) {
      userMessage = fieldErrors.password[0];
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
      }),
      { status: 400 }
    );
  }

  const { email, password } = validationResult.data;

  // Create server-side Supabase client
  // This handles cookie management for auth session
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attempt to sign in with Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle authentication errors
  if (error) {
    // Generic error message for security (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        error: "Nieprawidłowy email lub hasło",
      }),
      { status: 401 }
    );
  }

  // Success: Redirect to generator page
  // Server-side redirect ensures cookies are properly set before navigation
  // Using 303 status to force GET request after POST
  return redirect("/generate", 303);
};
