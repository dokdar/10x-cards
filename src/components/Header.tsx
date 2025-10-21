import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Header({ isAuthenticated, userEmail }: { isAuthenticated: boolean; userEmail?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/logout';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">10x Cards</span>
          </a>
        </div>

        <nav className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <>
                <a href="/generate" className="text-sm font-medium transition-colors hover:text-primary">
                  Generator
                </a>
                <div className="flex items-center gap-2 px-2">
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]" title={userEmail}>
                    {userEmail}
                  </span>
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
          </div>

          {/* Mobile Theme Toggle - Only theme toggle visible on mobile */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
