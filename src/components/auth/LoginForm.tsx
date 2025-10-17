import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * LoginForm Component
 *
 * Handles user authentication with email and password
 * Communicates with /api/auth/login endpoint
 * On success, redirects to home page
 */
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
   * 2. Submit form to API (server will handle redirect)
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Guard: Check if fields are empty
    if (!email || !password) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    // Guard: Validate email format
    if (!isValidEmail(email)) {
      setError("Podaj prawidłowy adres e-mail");
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LOGIN CLIENT] Sending fetch to /api/auth/login');

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      console.log('[LOGIN CLIENT] Response status:', response.status);

      // If error, show it
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Błąd logowania');
        setIsLoading(false);
        return;
      }

      // Success: Server will redirect, we follow it
      // Check if response is a redirect (3xx status or Location header)
      if (response.redirected) {
        console.log('[LOGIN CLIENT] Following redirect to:', response.url);
        window.location.href = response.url;
      } else {
        // Fallback: redirect manually
        console.log('[LOGIN CLIENT] Manual redirect to /generate');
        window.location.href = "/generate";
      }

    } catch (_err) {
      // Handle network errors
      setError("Błąd sieci. Spróbuj ponownie.");
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
          placeholder="Twoje hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isLoading} className="w-full" aria-busy={isLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline text-center"
          tabIndex={isLoading ? -1 : 0}
        >
          Zapomniałeś hasła?
        </a>
      </div>

      {/* Registration Link */}
      <p className="text-sm text-muted-foreground text-center">
        Nie masz konta?{" "}
        <a href="/register" className="text-primary hover:underline font-medium" tabIndex={isLoading ? -1 : 0}>
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
