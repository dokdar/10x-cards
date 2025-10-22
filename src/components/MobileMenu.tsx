import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface MobileMenuProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function MobileMenu({ isAuthenticated = false, userEmail, onLogout, isLoggingOut }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={isOpen}>
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={closeMenu} aria-hidden="true" />

          {/* Menu Panel */}
          <div className="fixed top-14 right-0 left-0 bg-background border-b shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-4 space-y-4">
              {isAuthenticated && (
                <>
                  <a
                    href="/generate"
                    className="block text-lg font-medium transition-colors hover:text-primary py-2"
                    onClick={closeMenu}
                  >
                    Generator
                  </a>

                  {/* User Info */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Zalogowany jako: <span className="font-medium">{userEmail}</span>
                    </p>
                    <button
                      className="w-full text-left text-lg font-medium transition-colors hover:text-primary py-2 disabled:opacity-50"
                      onClick={() => {
                        onLogout?.();
                        closeMenu();
                      }}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="space-y-3">
                  <a
                    href="/login"
                    className="block text-lg font-medium transition-colors hover:text-primary py-2"
                    onClick={closeMenu}
                  >
                    Zaloguj się
                  </a>
                  <a
                    href="/register"
                    className="block bg-primary text-primary-foreground px-4 py-3 rounded-md hover:bg-primary/90 transition-colors text-center font-medium"
                    onClick={closeMenu}
                  >
                    Zarejestruj się
                  </a>
                </div>
              )}

              {/* Theme Toggle */}
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-sm font-medium">Motyw</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
