import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

// Logs each incoming request and, once finished, its status and duration.
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  log(`--> ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.query).length) log('    query:', { ...req.query });
  if (req.body && Object.keys(req.body).length) log('    body:', req.body);

  res.on('finish', () => {
    log(`<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });

  next();
}
