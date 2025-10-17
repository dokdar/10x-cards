import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';
import { updatePasswordSchema } from '@/lib/validation/auth.schema';

/**
 * POST /api/auth/update-password
 *
 * Updates user password during password reset flow
 * Uses PKCE code from URL to authorize password change
 * User is NOT logged in until they change password
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('[UPDATE PASSWORD] Starting password update');

  // Guard: Ensure request method is POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { password, confirmPassword, code } = body;

  // Guard: Validate required fields
  if (!password || !confirmPassword || !code) {
    return new Response(
      JSON.stringify({
        error: 'Brak wymaganych pól (password, confirmPassword, code)',
      }),
      { status: 400 }
    );
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    return new Response(
      JSON.stringify({
        error: 'Hasła nie są identyczne',
      }),
      { status: 400 }
    );
  }

  // Validate password length
  if (password.length < 8) {
    return new Response(
      JSON.stringify({
        error: 'Hasło musi mieć co najmniej 8 znaków',
      }),
      { status: 400 }
    );
  }

  console.log('[UPDATE PASSWORD] Code provided:', code ? 'YES' : 'NO');

  // Create server-side Supabase client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Step 1: Exchange PKCE code for session (temporarily)
  // This creates a recovery session that we'll use to update password
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.session) {
    console.error('[UPDATE PASSWORD] Code exchange failed:', sessionError);
    return new Response(
      JSON.stringify({
        error: 'Link do resetowania hasła wygasł. Poproś o nowy.',
      }),
      { status: 400 }
    );
  }

  console.log('[UPDATE PASSWORD] Code exchanged, user:', sessionData.user?.email);

  // Step 2: Update password using the recovery session
  const { error: updateError } = await supabase.auth.updateUser({
    password: password,
  });

  if (updateError) {
    console.error('[UPDATE PASSWORD] Update failed:', updateError);
    
    // Handle specific error: same password
    if (updateError.message.includes('same password') || updateError.code === 'same_password') {
      return new Response(
        JSON.stringify({ 
          error: 'Nowe hasło musi być inne niż poprzednie.',
        }),
        { status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Nie udało się zmienić hasła. Spróbuj ponownie.',
        details: updateError.message 
      }),
      { status: 400 }
    );
  }

  console.log('[UPDATE PASSWORD] Password updated successfully');

  // Step 3: Sign out the recovery session
  // User must now log in with their new password
  await supabase.auth.signOut();

  console.log('[UPDATE PASSWORD] Recovery session terminated');

  // Return success JSON
  // Frontend will handle redirect to login page
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Hasło zostało zmienione. Zaloguj się z nowym hasłem.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
