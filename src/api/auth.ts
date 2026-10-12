import { clearTokens, getRefreshToken, saveTokens } from '../utils/tokenStorage';
import { api } from './client';
import { deletePushToken } from './me';
import { AuthResult, MessageResponse, User } from './types';

export type RegisterInput = { email: string; password: string; name?: string };
export type LoginInput = { email: string; password: string };
export type VerifyEmailInput = { email: string; code: string };
export type ResetPasswordInput = { email: string; code: string; newPassword: string };

export const register = async (input: RegisterInput) =>
  (await api.post<MessageResponse & { user: User }>('/auth/register', input)).data;

/** Verifies the code and stores the session tokens */
export const verifyEmail = async (input: VerifyEmailInput) => {
  const { data } = await api.post<AuthResult>('/auth/verify-email', input);
  await saveTokens(data);
  return data;
};

export const resendCode = async (email: string) =>
  (await api.post<MessageResponse>('/auth/resend-code', { email })).data;

/** Logs in and stores the session tokens */
export const login = async (input: LoginInput) => {
  const { data } = await api.post<AuthResult>('/auth/login', input);
  await saveTokens(data);
  return data;
};

export const forgotPassword = async (email: string) =>
  (await api.post<MessageResponse>('/auth/forgot-password', { email })).data;

export const resetPassword = async (input: ResetPasswordInput) =>
  (await api.post<MessageResponse>('/auth/reset-password', input)).data;

/**
 * Stops push notifications and ends the session on the server (best effort),
 * then always clears the local tokens.
 */
export const logout = async () => {
  try {
    await deletePushToken().catch(() => undefined);
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
  } finally {
    await clearTokens();
  }
};

export const getMe = async () => (await api.get<{ user: User }>('/auth/me')).data.user;

/** Whether a session was saved on this device (the access token may still need a refresh) */
export const hasSession = async () => !!(await getRefreshToken());

/** Name for greetings: the user's name, or the part of the email before "@" */
export const getDisplayName = (user: User) => user.name?.trim() || user.email.split('@')[0];
