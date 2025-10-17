import { z } from "zod";

/**
 * Schema for login credentials validation
 * Used in both client-side and server-side validation
 */
export const loginSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Type inferred from loginSchema for use in forms and API
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for registration credentials validation
 * Includes password confirmation and minimum length requirement
 */
export const registerSchema = z
  .object({
    email: z.string().email("Podaj prawidłowy adres e-mail"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inferred from registerSchema for use in forms and API
 */
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schema for forgot password email validation
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres e-mail"),
});

/**
 * Type inferred from forgotPasswordSchema
 */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for password update validation (during reset flow)
 * Includes password confirmation and minimum length requirement
 */
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inferred from updatePasswordSchema
 */
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
