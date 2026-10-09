import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';
import { logError } from '../utils/logger';

// Catches errors passed to next(err) or thrown in route handlers.
export function errorHandler(
  err: Error & { status?: number },
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status || 500;

  if (status >= 500) logError(`!!! ${req.method} ${req.originalUrl}`, err.stack || err);

  // HttpErrors carry messages meant for clients; anything else (e.g. database errors) stays hidden
  const message = err instanceof HttpError || status < 500 ? err.message : 'Internal Server Error';
  const body: Record<string, unknown> = { error: message };
  if (err instanceof HttpError) {
    if (err.code) body.code = err.code;
    if (err.details) body.details = err.details;
  }

  res.status(status).json(body);
}
