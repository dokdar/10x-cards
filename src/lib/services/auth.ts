import type { LoginInput, RegisterInput, ForgotPasswordInput, UpdatePasswordInput } from "@/lib/validation/auth.schema";

export type AuthResult = {
  ok: boolean;
  error?: string;
  message?: string;
  requiresVerification?: boolean;
  redirectUrl?: string;
  /** Optional field-specific validation issues returned by API */
  details?: Array<{ path: (string | number)[]; message: string }>;
};

const jsonHeaders = { "Content-Type": "application/json" } as const;

async function parseJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      credentials: "include",
      body: JSON.stringify({ email: input.email.trim(), password: input.password }),
    });

    if (!res.ok) {
      const data = await parseJsonSafe<{ error?: string }>(res);
      return { ok: false, error: data?.error || "Błąd logowania" };
    }

    // Server performs redirect on success (303). Fetch follows it, so check redirected
    if (res.redirected) {
      return { ok: true, redirectUrl: res.url };
    }

    // Fallback
    return { ok: true, redirectUrl: "/generate" };
  } catch (_err) {
    return { ok: false, error: "Błąd sieci. Spróbuj ponownie." };
  }
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: jsonHeaders,
      credentials: "include",
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
        confirmPassword: input.confirmPassword,
      }),
    });

    if (!res.ok) {
      const data = await parseJsonSafe<{ error?: string }>(res);
      return { ok: false, error: data?.error || "Błąd rejestracji. Spróbuj ponownie później." };
    }

    if (res.redirected) {
      return { ok: true, redirectUrl: res.url };
    }

    const data = await parseJsonSafe<{ message?: string; requiresVerification?: boolean }>(res);
    if (data?.requiresVerification) {
      return { ok: true, requiresVerification: true, message: data.message };
    }

    return { ok: true, redirectUrl: "/generate" };
  } catch (_err) {
    return { ok: false, error: "Błąd sieci. Spróbuj ponownie." };
  }
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: jsonHeaders,
      credentials: "include",
      body: JSON.stringify({ email: input.email.trim() }),
    });

    const data = await parseJsonSafe<{
      error?: string;
      success?: boolean;
      message?: string;
      details?: Array<{ path: (string | number)[]; message: string }>;
    }>(res);

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || "Nie udało się wysłać e-maila. Spróbuj ponownie.",
        details: data?.details,
      };
    }

    return { ok: true, message: data?.message };
  } catch (_err) {
    return { ok: false, error: "Błąd sieci. Spróbuj ponownie." };
  }
}

export async function updatePassword(input: UpdatePasswordInput & { code: string }): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: jsonHeaders,
      credentials: "include",
      body: JSON.stringify({
        password: input.password,
        confirmPassword: input.confirmPassword,
        code: input.code,
      }),
    });

    const data = await parseJsonSafe<{ error?: string; success?: boolean; message?: string }>(res);

    if (!res.ok) {
      return { ok: false, error: data?.error || "Nie udało się zmienić hasła. Spróbuj ponownie." };
    }

    return { ok: true, message: data?.message };
  } catch (_err) {
    return { ok: false, error: "Błąd sieci. Spróbuj ponownie." };
  }
}
