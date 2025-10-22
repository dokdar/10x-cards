import type { APIRoute } from "astro";
import { registerSchema } from "@/lib/validation/auth.schema";
import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password
 * Returns user object and session status on success
 * Supabase automatically sets auth cookies and sends verification email
 */
export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  // Guard: Ensure request method is POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  // Guard: Prevent already authenticated users from registering
  if (locals.user) {
    return new Response(JSON.stringify({ error: "Jesteś już zalogowany" }), { status: 403 });
  }

  // Guard: Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  // Guard: Validate input against schema
  const validationResult = registerSchema.safeParse(body);
  if (!validationResult.success) {
    // Map Zod errors to user-friendly messages
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    let userMessage = "Walidacja nie powiodła się";

    // Get the first error message from any field
    if (fieldErrors.email && fieldErrors.email[0]) {
      userMessage = fieldErrors.email[0];
    } else if (fieldErrors.password && fieldErrors.password[0]) {
      userMessage = fieldErrors.password[0];
    } else if (fieldErrors.confirmPassword && fieldErrors.confirmPassword[0]) {
      userMessage = fieldErrors.confirmPassword[0];
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

  // Attempt to sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Handle authentication errors
  if (error) {
    // Map Supabase error codes to user-friendly messages
    let userMessage = "Błąd rejestracji. Spróbuj ponownie.";

    if (error.message.includes("already registered")) {
      userMessage = "Konto już istnieje. Zaloguj się lub odzyskaj hasło.";
    } else if (error.message.includes("weak password")) {
      userMessage = "Hasło jest zbyt słabe. Spróbuj silniejszego hasła.";
    } else if (error.message.includes("invalid email")) {
      userMessage = "Podaj prawidłowy adres e-mail.";
    }

    return new Response(JSON.stringify({ error: userMessage }), {
      status: 400,
    });
  }

  // Success: Check if email verification is required
  // If session is null, email verification is required - return message
  // If session exists, user is logged in - redirect to app
  const sessionExists = data.session !== null;

  if (!sessionExists) {
    // Email verification required - return JSON with message
    return new Response(
      JSON.stringify({
        message: "Sprawdź e-mail aby potwierdzić konto",
        requiresVerification: true,
      }),
      { status: 200 }
    );
  }

  // User is logged in - redirect to generator page
  // Server-side redirect ensures cookies are properly set before navigation
  return redirect("/generate", 303);
};
