import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schema";
import { login as loginService } from "@/lib/services/auth";

/**
 * LoginForm Component
 *
 * Handles user authentication with email and password
 * Communicates with /api/auth/login endpoint
 * On success, redirects to home page
 */
export default function LoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onValid = async (values: LoginInput) => {
    const result = await loginService(values);

    if (!result.ok) {
      setError("root", { message: result.error ?? "Błąd logowania" });
      return;
    }

    if (result.redirectUrl) {
      // eslint-disable-next-line react-compiler/react-compiler -- window.location.href in async handler is safe
      window.location.href = result.redirectUrl;
      return;
    }

    // Fallback
    window.location.href = "/generate";
  };

  const onInvalid = (invalid: FieldErrors<LoginInput>) => {
    // Preferuj komunikaty pól; w przeciwnym razie pokaż ogólny
    // Debug: pokaż błędy w testach
    console.warn("LoginForm onInvalid", invalid);
    if (invalid.email?.message) {
      setError("root", { message: String(invalid.email.message) });
      return;
    }
    if (invalid.password?.message) {
      setError("root", { message: String(invalid.password.message) });
      return;
    }
    setError("root", { message: "Wszystkie pola są wymagane" });
  };

  const onSubmit = handleSubmit(onValid, onInvalid);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Error Alert */}
      {(errors.root?.message || errors.email?.message || errors.password?.message) && (
        <Alert variant="destructive" className="animate-in" role="alert">
          <AlertDescription>
            {errors.root?.message || errors.email?.message || errors.password?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email")}
          disabled={isSubmitting}
          required
          aria-invalid={!!errors.email}
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
          {...register("password")}
          disabled={isSubmitting}
          required
          aria-invalid={!!errors.password}
          autoComplete="current-password"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline text-center"
          tabIndex={isSubmitting ? -1 : 0}
        >
          Zapomniałeś hasła?
        </a>
      </div>

      {/* Registration Link */}
      <p className="text-sm text-muted-foreground text-center">
        Nie masz konta?{" "}
        <a href="/register" className="text-primary hover:underline font-medium" tabIndex={isSubmitting ? -1 : 0}>
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
