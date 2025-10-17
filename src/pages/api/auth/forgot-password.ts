import type { APIRoute } from 'astro';
import { forgotPasswordSchema } from '@/lib/validation/auth.schema';
import { createSupabaseServerInstance } from '@/db/supabase.client';

/**
 * POST /api/auth/forgot-password
 *
 * Sends password reset email to user
 * Returns generic success message for security (doesn't leak if email exists)
 * Supabase automatically handles email sending and link generation
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Guard: Ensure request method is POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  // Guard: Prevent already authenticated users from requesting password reset
  if (locals.user) {
    return new Response(
      JSON.stringify({ error: 'Jesteś już zalogowany' }),
      { status: 403 },
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

  // Guard: Validate input against schema
  const validationResult = forgotPasswordSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }),
      { status: 400 },
    );
  }

  const { email } = validationResult.data;

  // Create server-side Supabase client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attempt to send password reset email
  // Note: Supabase returns success even if email doesn't exist (for security)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  // Handle errors (mainly rate limiting)
  if (error) {
    // Check for rate limiting
    if (error.message.includes('rate limit') || error.message.includes('too many')) {
      return new Response(
        JSON.stringify({
          error: 'Za wiele prób. Spróbuj za kilka minut.',
        }),
        { status: 429 },
      );
    }

    // Generic error message for other errors
    return new Response(
      JSON.stringify({
        error: 'Nie udało się wysłać e-maila. Spróbuj ponownie.',
      }),
      { status: 400 },
    );
  }

  // Success: Return generic message (don't leak if email exists or not)
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Sprawdź e-mail aby otrzymać link do resetowania hasła',
    }),
    { status: 200 },
  );
};
