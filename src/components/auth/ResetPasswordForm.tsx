import { useEffect } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validation/auth.schema";
import { updatePassword as updatePasswordService } from "@/lib/services/auth";
import { usePkceParams } from "@/lib/hooks/usePkceParams";

/**
 * ResetPasswordForm Component
 *
 * Handles password reset with new password confirmation
 * Communicates with /api/auth/update-password endpoint
 * Token is passed via Supabase session (from URL hash)
 * Logs out user if they were logged in
 */
export default function ResetPasswordForm() {
  const { code, errorCode, errorDescription } = usePkceParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  // Surface URL-derived errors on mount
  useEffect(() => {
    if (errorCode === "otp_expired") {
      setError("root", { message: "Link do resetowania hasła wygasł. Poproś o nowy link." });
    } else if (errorDescription) {
      setError("root", { message: errorDescription });
    }
  }, [errorCode, errorDescription, setError]);

  const onValid = async (values: UpdatePasswordInput) => {
    if (!code) {
      setError("root", { message: "Brak kodu autoryzacji. Link mógł wygasnąć. Poproś o nowy." });
      return;
    }

    const result = await updatePasswordService({ ...values, code });

    if (!result.ok) {
      setError("root", { message: result.error ?? "Nie udało się zmienić hasła. Spróbuj ponownie." });
      return;
    }

    window.location.href = "/password-changed";
  };

  const onInvalid = (invalid: FieldErrors<UpdatePasswordInput>) => {
    // Pokaż ogólny komunikat tylko jeśli nie ma błędów pól
    const hasFieldErrors = Boolean(invalid.password || invalid.confirmPassword);
    if (!hasFieldErrors) {
      setError("root", { message: "Wszystkie pola są wymagane" });
    }
  };

  const onSubmit = handleSubmit(onValid, onInvalid);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Error Alert */}
      {(errors.root?.message || errors.password?.message || errors.confirmPassword?.message) && (
        <Alert variant="destructive" className="animate-in" role="alert">
          <AlertDescription>
            {errors.root?.message || errors.password?.message || errors.confirmPassword?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 8 znaków"
          {...register("password")}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          required
          aria-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      {/* Action Button */}
      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
          {isSubmitting ? "Zmiana hasła..." : "Zmień hasło"}
        </Button>
      </div>

      {/* Login Link */}
      <p className="text-sm text-muted-foreground text-center">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-primary hover:underline font-medium" tabIndex={isSubmitting ? -1 : 0}>
          Zaloguj się
        </a>
      </p>

      {/* Link expired - request new one */}
      {errors.root?.message && errors.root.message.includes("wygasł") && (
        <p className="text-sm text-muted-foreground text-center">
          <a href="/forgot-password" className="text-primary hover:underline font-medium">
            Poproś o nowy link do resetowania
          </a>
        </p>
      )}
    </form>
  );
}
