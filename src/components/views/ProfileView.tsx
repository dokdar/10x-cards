import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, LogOut, Settings, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileViewProps {
  user?: {
    email?: string;
    id?: string;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Handle logout action
   * Server handles redirect, so we use form submission instead of fetch
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    console.log("[LOGOUT CLIENT] Starting logout via form submission...");

    // Create a hidden form and submit it
    // This allows the server to set cookies AND redirect properly
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";

    document.body.appendChild(form);
    console.log("[LOGOUT CLIENT] Submitting form to /api/auth/logout");
    form.submit();

    // Note: No need to remove form or reset state - page will redirect
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="container max-w-md px-4">
          <Alert>
            <AlertDescription>Musisz być zalogowany, aby zobaczyć profil.</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <a href="/login">Zaloguj się</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container max-w-md mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <header className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil</h1>
            <p className="text-muted-foreground">Zarządzaj swoim kontem i ustawieniami</p>
          </header>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacje o koncie
              </CardTitle>
              <CardDescription>Podstawowe informacje o Twoim koncie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Adres email</div>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md mt-1">{user.email}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">ID użytkownika</div>
                <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md mt-1 break-all">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ustawienia
              </CardTitle>
              <CardDescription>Dostosuj aplikację do swoich preferencji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Motyw</p>
                  <p className="text-sm text-muted-foreground">Wybierz jasny lub ciemny motyw</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Pomoc i wsparcie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/">Powrót do strony głównej</a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/generate">Generator fiszek</a>
              </Button>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Wyloguj się
              </CardTitle>
              <CardDescription>Zakończ sesję i wróć do strony logowania</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut} className="w-full">
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
