import type { APIRoute } from 'astro';
import { registerSchema } from '@/lib/validation/auth.schema';
import { createSupabaseServerInstance } from '@/db/supabase.client';

/**
 * POST /api/auth/update-password
 *
 * Updates user password during password reset flow
 * Requires valid session (from password reset token)
 * Returns success with auto-login via new session
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Guard: Ensure request method is POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  // Guard: Ensure user has valid session (from reset token)
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: 'Brak autoryzacji. Link mógł wygasnąć.' }),
      { status: 401 },
    );
  }

  // Guard: Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  // Guard: Validate password against schema (reuse registerSchema for password validation)
  // Extract password from body
  const { password, confirmPassword } = body;

  if (!password || !confirmPassword) {
    return new Response(
      JSON.stringify({ error: 'Hasło i potwierdzenie są wymagane' }),
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return new Response(
      JSON.stringify({ error: 'Hasła nie są identyczne' }),
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return new Response(
      JSON.stringify({ error: 'Hasło musi mieć co najmniej 8 znaków' }),
      { status: 400 },
    );
  }

  // Create server-side Supabase client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attempt to update password
  const { error } = await supabase.auth.updateUser({
    password,
  });

  // Handle authentication errors
  if (error) {
    // Map Supabase error codes to user-friendly messages
    let userMessage = 'Nie udało się zmienić hasła. Spróbuj ponownie.';

    if (error.message.includes('invalid grant') || error.message.includes('expired')) {
      userMessage = 'Link do resetowania hasła wygasł. Poproś o nowy.';
    } else if (error.message.includes('weak password')) {
      userMessage = 'Hasło jest za słabe. Spróbuj silniejszego hasła.';
    } else if (error.message.includes('not authenticated') || error.message.includes('unauthorized')) {
      userMessage = 'Sesja wygasła. Spróbuj ponownie.';
    }

    return new Response(JSON.stringify({ error: userMessage }), {
      status: 400,
    });
  }

  // Success: Password updated and user auto-logged in
  // New session created automatically by Supabase
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Hasło zostało zmienione pomyślnie',
    }),
    { status: 200 },
  );
};
