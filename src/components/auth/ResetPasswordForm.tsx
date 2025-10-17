import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

/**
 * ResetPasswordForm Component
 *
 * Handles password reset with new password confirmation
 * Communicates with /api/auth/update-password endpoint
 * Token is passed via Supabase session (from URL hash)
 * On success, auto-logs user in and redirects to home
 */
export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate password strength
   * Minimum 8 characters required
   */
  const isValidPassword = (passwordValue: string): boolean => {
    return passwordValue.length >= 8;
  };

  /**
   * Handle form submission
   * 1. Validate input client-side
   * 2. Send new password to API
   * 3. Handle errors or redirect on success
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

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

    try {
      // Send password update request to API endpoint
      // Token is already in Supabase session (extracted from URL hash)
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      // Guard: Check if response is OK
      if (!response.ok) {
        const data = await response.json();

        // Set error message from API or generic message
        const errorMessage =
          data.error || 'Nie udało się zmienić hasła. Spróbuj ponownie.';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success: Redirect to home page (full page reload)
      // This ensures middleware validates the new session
      window.location.href = '/';
    } catch (err) {
      // Handle network errors
      setError('Błąd sieci. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-in">
          {error}
        </Alert>
      )}

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <Input
          id="password"
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
        <Button type="submit" disabled={isLoading} className="w-full" aria-busy={isLoading}>
          {isLoading ? 'Zmiana hasła...' : 'Zmień hasło'}
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
    </form>
  );
}
