import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { HttpError } from '../utils/httpError';

// Expects "Authorization: Bearer <accessToken>" and sets req.userId.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing access token', 'UNAUTHORIZED');

  req.userId = verifyAccessToken(header.slice(7));
  next();
}
