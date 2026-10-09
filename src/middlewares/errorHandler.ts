import type { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

export interface HttpError extends Error {
  status?: number;
}

// Catches errors passed to next(err) or thrown in route handlers.
export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction): void {
  logError(`!!! ${req.method} ${req.originalUrl}`, err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
