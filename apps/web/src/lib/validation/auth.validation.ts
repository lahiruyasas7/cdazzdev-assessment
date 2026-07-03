// src/lib/validation/auth.ts
import { z } from "zod";

/**
 * These rules mirror apps/api/src/auth/dto/{login,register}.dto.ts
 * exactly. Keeping them in sync matters: a looser client-side rule just
 * means a wasted round trip (the API still rejects it correctly), but a
 * STRICTER client-side rule could block a value the API would actually
 * accept — e.g. if the API's password minimum ever changes, this file
 * needs updating too. No automatic sharing between the two apps right
 * now (they're separate codebases) — noted here so it's a known,
 * deliberate gap rather than an invisible one.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
