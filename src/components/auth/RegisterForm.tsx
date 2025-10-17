import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * RegisterForm Component
 *
 * Handles user registration with email and password
 * Communicates with /api/auth/register endpoint
 * Shows email verification message or redirects on success
 */
export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate email format using regex
   * Provides quick client-side feedback without API call
   */
  const isValidEmail = (emailValue: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  };

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
   * 2. Send credentials to API
   * 3. Handle errors or show verification message
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Guard: Check if fields are empty
    if (!email || !password || !confirmPassword) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    // Guard: Validate email format
    if (!isValidEmail(email)) {
      setError('Podaj prawidłowy adres e-mail');
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
      // Send registration request to API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      // Guard: Check if response is OK
      if (!response.ok) {
        const data = await response.json();

        // Set error message from API or generic message
        const errorMessage =
          data.error || 'Błąd rejestracji. Spróbuj ponownie później.';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success: Handle based on response
      const data = await response.json();

      // Check if email verification is required
      if (data.requiresVerification) {
        // Email verification required - show message instead of redirect
        setSuccessMessage(data.message);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else if (response.redirected) {
        // Server redirected - follow it
        console.log('[REGISTER CLIENT] Following redirect to:', response.url);
        window.location.href = response.url;
      } else {
        // Fallback: redirect manually
        window.location.href = '/generate';
      }
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert variant="default" className="animate-in border-green-500 text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
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

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="w-full"
          aria-busy={isLoading}
        >
          {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się'}
        </Button>
      </div>

      {/* Login Link */}
      <p className="text-sm text-muted-foreground text-center">
        Masz już konto?{' '}
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
