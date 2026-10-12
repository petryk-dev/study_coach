import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

const SENSITIVE_KEYS = ['password', 'newPassword', 'code', 'refreshToken', 'accessToken'];

function redact(body: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...body };
  for (const key of SENSITIVE_KEYS) if (key in copy) copy[key] = '[redacted]';
  return copy;
}

// Long strings (e.g. pasted notes) are cut so one request doesn't flood the log
function shorten(body: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...body };
  for (const [key, value] of Object.entries(copy)) {
    if (typeof value === 'string' && value.length > 200) copy[key] = `${value.slice(0, 200)}... (${value.length} chars)`;
  }
  return copy;
}

// Logs each incoming request and, once finished, its status and duration.
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  log(`--> ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.query).length) log('    query:', { ...req.query });
  if (req.body && Object.keys(req.body).length) log('    body:', shorten(redact(req.body)));

  res.on('finish', () => {
    log(`<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });

  next();
}
