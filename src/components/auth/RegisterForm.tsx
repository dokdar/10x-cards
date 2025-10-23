import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth.schema";
import { register as registerService } from "@/lib/services/auth";

/**
 * RegisterForm Component
 *
 * Handles user registration with email and password
 * Communicates with /api/auth/register endpoint
 * Shows email verification message or redirects on success
 */
export default function RegisterForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onValid = async (values: RegisterInput) => {
    const result = await registerService(values);

    if (!result.ok) {
      setError("root", { message: result.error ?? "Błąd rejestracji. Spróbuj ponownie później." });
      return;
    }

    // Requires email verification
    if (result.requiresVerification) {
      setSuccessMessage(result.message ?? "Sprawdź e-mail aby potwierdzić konto");
      reset();
      return;
    }

    // Redirect on success
    if (result.redirectUrl) {
      // eslint-disable-next-line react-compiler/react-compiler -- window.location.href in async handler is safe
      window.location.href = result.redirectUrl;
      return;
    }

    window.location.href = "/generate";
  };

  const onInvalid = (invalid: FieldErrors<RegisterInput>) => {
    // Preferuj komunikaty pól; w przeciwnym razie pokaż ogólny
    if (invalid.email?.message) {
      setError("root", { message: String(invalid.email.message) });
      return;
    }
    if (invalid.password?.message) {
      setError("root", { message: String(invalid.password.message) });
      return;
    }
    if (invalid.confirmPassword?.message) {
      setError("root", { message: String(invalid.confirmPassword.message) });
      return;
    }
    setError("root", { message: "Wszystkie pola są wymagane" });
  };

  const onSubmit = handleSubmit(onValid, onInvalid);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Error Alert */}
      {(errors.root?.message ||
        errors.email?.message ||
        errors.password?.message ||
        errors.confirmPassword?.message) && (
        <Alert variant="destructive" className="animate-in" role="alert">
          <AlertDescription>
            {errors.root?.message ||
              errors.email?.message ||
              errors.password?.message ||
              errors.confirmPassword?.message}
          </AlertDescription>
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
          {...register("email")}
          disabled={isSubmitting || !!successMessage}
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
          placeholder="Minimum 8 znaków"
          {...register("password")}
          disabled={isSubmitting || !!successMessage}
          required
          aria-invalid={!!errors.password}
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
          {...register("confirmPassword")}
          disabled={isSubmitting || !!successMessage}
          required
          aria-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isSubmitting || !!successMessage} className="w-full" aria-busy={isSubmitting}>
          {isSubmitting ? "Rejestrowanie..." : "Zarejestruj się"}
        </Button>
      </div>

      {/* Login Link */}
      <p className="text-sm text-muted-foreground text-center">
        Masz już konto?{" "}
        <a
          href="/login"
          className="text-primary hover:underline font-medium"
          tabIndex={isSubmitting || !!successMessage ? -1 : 0}
        >
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
