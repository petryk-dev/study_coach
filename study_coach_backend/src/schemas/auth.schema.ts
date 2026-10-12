import { z } from 'zod';

const email = z.email().trim().toLowerCase();
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);
const code = z.string().regex(/^\d{6}$/, 'Code must be 6 digits');

export const registerSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({ email, code });

export const resendCodeSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ email, code, newPassword: password });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
