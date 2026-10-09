import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import prisma from './db';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Refresh tokens are stored hashed, so a database leak doesn't expose usable tokens.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): number {
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
    return Number(payload.sub);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new HttpError(401, 'Access token expired', 'TOKEN_EXPIRED');
    throw new HttpError(401, 'Invalid access token', 'UNAUTHORIZED');
  }
}

export async function issueTokens(userId: number): Promise<AuthTokens> {
  const expiresAt = new Date(Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000);
  const refreshToken = jwt.sign({ sub: String(userId), jti: crypto.randomUUID() }, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshExpiresDays}d`,
  });

  await prisma.refresh_tokens.create({
    data: { user_id: userId, token_hash: hashToken(refreshToken), expires_at: expiresAt },
  });

  return { accessToken: signAccessToken(userId), refreshToken };
}

/**
 * Rotates a refresh token: the old one is deleted and a new pair is issued.
 * If a validly signed token is no longer in the database, it was already used
 * (possibly stolen), so every session for that user is revoked.
 */
export async function rotateRefreshToken(refreshToken: string): Promise<AuthTokens> {
  let userId: number;
  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as jwt.JwtPayload;
    userId = Number(payload.sub);
  } catch {
    throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const { count } = await prisma.refresh_tokens.deleteMany({ where: { token_hash: hashToken(refreshToken) } });
  if (count === 0) {
    await prisma.refresh_tokens.deleteMany({ where: { user_id: userId } });
    throw new HttpError(401, 'Refresh token was already used', 'REFRESH_TOKEN_REUSED');
  }

  return issueTokens(userId);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refresh_tokens.deleteMany({ where: { token_hash: hashToken(refreshToken) } });
}
