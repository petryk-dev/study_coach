import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { users } from '@prisma/client';
import prisma from './db';
import { issueTokens, type AuthTokens } from './token.service';
import { sendCodeEmail, type CodePurpose } from './mail.service';
import { HttpError } from '../utils/httpError';
import type { LoginInput, RegisterInput, ResetPasswordInput, VerifyEmailInput } from '../schemas/auth.schema';

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const PASSWORD_SALT_ROUNDS = 12;

// Used so login takes the same time whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

export type PublicUser = Omit<users, 'password_hash'>;

export function toPublicUser({ password_hash: _hash, ...user }: users): PublicUser {
  return user;
}

// ---------- Email codes (shared by verification and password reset) ----------

async function createAndSendCode(user: users, purpose: CodePurpose): Promise<void> {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

  // Only the newest code of each purpose is valid
  await prisma.email_codes.deleteMany({ where: { user_id: user.id, purpose } });
  await prisma.email_codes.create({
    data: {
      user_id: user.id,
      purpose,
      code_hash: await bcrypt.hash(code, 10),
      expires_at: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  await sendCodeEmail(user.email, code, purpose);
}

async function resendWithCooldown(user: users, purpose: CodePurpose): Promise<void> {
  const latest = await prisma.email_codes.findFirst({
    where: { user_id: user.id, purpose },
    orderBy: { created_at: 'desc' },
  });
  if (latest?.created_at && Date.now() - latest.created_at.getTime() < RESEND_COOLDOWN_MS) {
    throw new HttpError(429, 'Please wait a minute before requesting a new code', 'TOO_SOON');
  }

  await createAndSendCode(user, purpose);
}

// Throws unless the code is correct, unexpired and under the attempt limit.
async function checkCode(user: users, purpose: CodePurpose, code: string): Promise<void> {
  const invalid = new HttpError(400, 'Invalid or expired code', 'INVALID_CODE');

  const record = await prisma.email_codes.findFirst({
    where: { user_id: user.id, purpose },
    orderBy: { created_at: 'desc' },
  });
  if (!record || record.expires_at < new Date()) throw invalid;
  if ((record.attempts ?? 0) >= CODE_MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many attempts, please request a new code', 'TOO_MANY_ATTEMPTS');
  }

  if (!(await bcrypt.compare(code, record.code_hash))) {
    await prisma.email_codes.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw invalid;
  }
}

// ---------- Registration and email verification ----------

export async function register({ email, password, name }: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    const hint = existing.email_verified ? 'Please log in' : 'Please verify it or request a new code';
    throw new HttpError(409, `Email is already registered. ${hint}`, 'EMAIL_TAKEN');
  }

  const user = await prisma.users.create({
    data: { email, name, password_hash: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS) },
  });

  await createAndSendCode(user, 'verify_email');
  return toPublicUser(user);
}

export async function resendCode(email: string): Promise<void> {
  const user = await prisma.users.findUnique({ where: { email } });
  // Same response whether or not the account exists or is already verified
  if (!user || user.email_verified) return;

  await resendWithCooldown(user, 'verify_email');
}

export async function verifyEmail({ email, code }: VerifyEmailInput): Promise<{ user: PublicUser } & AuthTokens> {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw new HttpError(400, 'Invalid or expired code', 'INVALID_CODE');
  if (user.email_verified) throw new HttpError(400, 'Email is already verified', 'ALREADY_VERIFIED');

  await checkCode(user, 'verify_email', code);

  const [verified] = await prisma.$transaction([
    prisma.users.update({ where: { id: user.id }, data: { email_verified: true } }),
    prisma.email_codes.deleteMany({ where: { user_id: user.id, purpose: 'verify_email' } }),
  ]);

  return { user: toPublicUser(verified), ...(await issueTokens(user.id)) };
}

// ---------- Login ----------

export async function login({ email, password }: LoginInput): Promise<{ user: PublicUser } & AuthTokens> {
  const user = await prisma.users.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !passwordOk) throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  if (!user.email_verified) {
    throw new HttpError(403, 'Please verify your email before logging in', 'EMAIL_NOT_VERIFIED');
  }

  return { user: toPublicUser(user), ...(await issueTokens(user.id)) };
}

// ---------- Password reset ----------

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.users.findUnique({ where: { email } });
  // Same response whether or not the account exists
  if (!user) return;

  await resendWithCooldown(user, 'reset_password');
}

/**
 * Sets a new password after checking the emailed code. All existing sessions are
 * logged out, and the email counts as verified since the user proved they own it.
 */
export async function resetPassword({ email, code, newPassword }: ResetPasswordInput): Promise<void> {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw new HttpError(400, 'Invalid or expired code', 'INVALID_CODE');

  await checkCode(user, 'reset_password', code);

  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: { password_hash: await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS), email_verified: true },
    }),
    prisma.email_codes.deleteMany({ where: { user_id: user.id } }),
    prisma.refresh_tokens.deleteMany({ where: { user_id: user.id } }),
  ]);
}

// ---------- Current user ----------

export async function getUser(userId: number): Promise<PublicUser> {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found', 'NOT_FOUND');
  return toPublicUser(user);
}
