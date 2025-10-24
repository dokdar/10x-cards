import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useFeature } from "@/features";

export function Header({ isAuthenticated, userEmail }: { isAuthenticated: boolean; userEmail?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthEnabled = useFeature("auth");
  const isGenerationsEnabled = useFeature("generations");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";
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
            {isAuthenticated && isAuthEnabled && (
              <>
                {isGenerationsEnabled && (
                  <a href="/generate" className="text-sm font-medium transition-colors hover:text-primary">
                    Generator
                  </a>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="truncate max-w-[150px]" title={userEmail}>
                        {userEmail}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Moje konto</p>
                        <p className="text-xs leading-none text-muted-foreground truncate" title={userEmail}>
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!isAuthenticated && isAuthEnabled && (
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
