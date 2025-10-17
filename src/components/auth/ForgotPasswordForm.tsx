import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

/**
 * ForgotPasswordForm Component
 *
 * Handles password reset request by email
 * Communicates with /api/auth/forgot-password endpoint
 * Shows success message after request (doesn't redirect)
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
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
   * Handle form submission
   * 1. Validate input client-side
   * 2. Send email to API
   * 3. Handle errors or show success message
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Guard: Check if email is empty
    if (!email) {
      setError('Adres e-mail jest wymagany');
      return;
    }

    // Guard: Validate email format
    if (!isValidEmail(email)) {
      setError('Podaj prawidłowy adres e-mail');
      return;
    }

    setIsLoading(true);

    try {
      // Send password reset request to API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      // Guard: Check if response is OK
      if (!response.ok) {
        const data = await response.json();

        // Set error message from API or generic message
        const errorMessage = data.error || 'Nie udało się wysłać e-maila. Spróbuj ponownie.';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success: Show message and reset form
      const data = await response.json();
      setSuccessMessage(data.message);
      setEmail('');
      setIsLoading(false);
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

      {/* Success Message */}
      {successMessage && (
        <Alert variant="default" className="animate-in border-green-500 text-green-700">
          {successMessage}
        </Alert>
      )}

      {/* Instructions */}
      <div className="space-y-3 mb-6">
        <p className="text-sm text-muted-foreground">
          Podaj swój adres e-mail, a my wyślemy Ci link do resetowania hasła.
        </p>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || !!successMessage}
          required
          autoComplete="email"
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
          {isLoading ? 'Wysyłanie...' : 'Wyślij link do resetowania'}
        </Button>

        <a href="/login" className="text-sm text-primary hover:underline text-center">
          Wróć do logowania
        </a>
      </div>

      {/* Registration Link */}
      <p className="text-sm text-muted-foreground text-center">
        Nie masz konta?{' '}
        <a href="/register" className="text-primary hover:underline font-medium">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
