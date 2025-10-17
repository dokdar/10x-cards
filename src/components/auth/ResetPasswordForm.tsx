import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * ResetPasswordForm Component
 *
 * Handles password reset with new password confirmation
 * Communicates with /api/auth/update-password endpoint
 * Token is passed via Supabase session (from URL hash)
 * Logs out user if they were logged in
 */
export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * On mount: Check for errors or PKCE code
   * Supabase sends errors in query params if token is invalid/expired
   */
  useEffect(() => {
    // Check for error in query params (expired/invalid token)
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');
    const code = urlParams.get('code');

    if (errorCode === 'otp_expired') {
      setError('Link do resetowania hasła wygasł. Poproś o nowy link.');
      return;
    }

    if (errorDescription) {
      setError(errorDescription.replace(/\+/g, ' '));
      return;
    }

    if (code) {
      console.log('[RESET PASSWORD] PKCE code detected in URL - ready for password reset');
    } else {
      console.warn('[RESET PASSWORD] No code in URL - user may have expired link');
    }
  }, []);

  /**
   * Validate password strength
   * Minimum 8 characters required
   */
  const isValidPassword = (passwordValue: string): boolean => {
    return passwordValue.length >= 8;
  };

  /**
   * Handle form submission
   * Uses fetch with JSON for API communication
   * Server handles redirect after successful password update
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Guard: Check if fields are empty
    if (!password || !confirmPassword) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    // Guard: Validate password strength
    if (!isValidPassword(password)) {
      setError('Hasło musi mieć co najmniej 8 znaków');
      return;
    }

    // Guard: Check password confirmation
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setIsLoading(true);
    console.log('[RESET PASSWORD] Submitting password update...');

    // Get PKCE code from URL - this authorizes the password change
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      setError('Brak kodu autoryzacji. Link mógł wygasnąć. Poproś o nowy.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password,
          confirmPassword,
          code, // Send PKCE code to backend
        }),
      });

      console.log('[RESET PASSWORD] Response status:', response.status);

      // Handle error responses
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Nie udało się zmienić hasła. Spróbuj ponownie.');
        setIsLoading(false);
        return;
      }

      // Success - show message and redirect after delay
      const data = await response.json();
      console.log('[RESET PASSWORD] Password updated successfully');
      
      setSuccessMessage('Hasło zostało zmienione! Przekierowywanie na stronę logowania...');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds to let user see the message
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('[RESET PASSWORD] Error:', err);
      setError('Błąd sieci. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert className="animate-in bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800">
          <AlertDescription>
            <svg className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Minimum 8 znaków"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">Hasło musi mieć co najmniej 8 znaków</p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdzenie hasła</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Potwierdź hasło"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="new-password"
        />
      </div>

      {/* Action Button */}
      <div className="flex flex-col gap-3">
        <Button 
          type="submit" 
          disabled={isLoading || !!successMessage} 
          className="w-full" 
          aria-busy={isLoading}
        >
          {isLoading ? 'Zmiana hasła...' : successMessage ? 'Przekierowywanie...' : 'Zmień hasło'}
        </Button>
      </div>

      {/* Login Link */}
      <p className="text-sm text-muted-foreground text-center">
        Pamiętasz hasło?{' '}
        <a
          href="/login"
          className="text-primary hover:underline font-medium"
          tabIndex={isLoading ? -1 : 0}
        >
          Zaloguj się
        </a>
      </p>

      {/* Link expired - request new one */}
      {error && error.includes('wygasł') && (
        <p className="text-sm text-muted-foreground text-center">
          <a
            href="/forgot-password"
            className="text-primary hover:underline font-medium"
          >
            Poproś o nowy link do resetowania
          </a>
        </p>
      )}
    </form>
  );
}
