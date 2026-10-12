import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../utils/httpError';

// Validates req.body against a zod schema and replaces it with the parsed result.
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', details);
    }
    req.body = result.data;
    next();
  };
}
