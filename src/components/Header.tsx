import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  isAuthenticated?: boolean;
  userEmail?: string;
}

export function Header({ isAuthenticated = false, userEmail }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Handle logout action
   * 1. Send POST to /api/auth/logout
   * 2. Cookies are automatically cleared by Supabase
   * 3. Redirect to login page
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    console.log('[LOGOUT CLIENT] Starting logout process...');

    try {
      console.log('[LOGOUT CLIENT] Sending fetch to /api/auth/logout');
      console.log('[LOGOUT CLIENT] Fetch options: method=POST, credentials=include');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('[LOGOUT CLIENT] Fetch completed');
      console.log('[LOGOUT CLIENT] Response status:', response.status);
      console.log('[LOGOUT CLIENT] Response ok:', response.ok);

      if (!response.ok) {
        console.error('[LOGOUT CLIENT] Response not OK');
        try {
          const errorData = await response.json();
          console.error('[LOGOUT CLIENT] Error data:', errorData);
          alert('Logout error: ' + (errorData.error || 'Unknown error'));
        } catch (parseError) {
          console.error('[LOGOUT CLIENT] Could not parse error response:', parseError);
          alert('Logout error: ' + response.status);
        }
        setIsLoggingOut(false);
        return;
      }

      console.log('[LOGOUT CLIENT] Response status OK (200)');
      console.log('[LOGOUT CLIENT] Logout successful, redirecting to /login...');

      // Success: Status 200 means logout worked on server
      // Don't parse response body - window.location.href will navigate
      // and response stream will change to HTML page
      console.log('[LOGOUT CLIENT] Calling window.location.href...');
      window.location.href = '/login';
      console.log('[LOGOUT CLIENT] Redirect executed (page should reload)');
    } catch (error) {
      console.error('[LOGOUT CLIENT] Catch error:', error);
      setIsLoggingOut(false);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">10x Cards</span>
          </a>
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <a href="/generate" className="text-sm font-medium transition-colors hover:text-primary">
                Generator
              </a>
              <div className="flex items-center gap-2 px-2">
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
              <button
                className="text-sm font-medium transition-colors hover:text-primary disabled:opacity-50"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
              >
                {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <a href="/login" className="text-sm font-medium transition-colors hover:text-primary">
                Zaloguj się
              </a>
              <a
                href="/register"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Zarejestruj się
              </a>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
