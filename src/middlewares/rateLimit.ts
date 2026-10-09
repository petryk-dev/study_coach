import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';

// Per-IP limits, kept in memory: fine for a single server instance.
// Behind a proxy (Render, Railway, Nginx...) set TRUST_PROXY=1 so the real client IP is used.
function limiter(windowMinutes: number, limit: number, extra: Partial<Options> = {}) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
    ...extra,
  });
}

export const registerLimiter = limiter(60, 5);

// Only failed logins count, so a user who logs in correctly is never blocked
export const loginLimiter = limiter(15, 10, { skipSuccessfulRequests: true });

// Endpoints that send emails
export const emailLimiter = limiter(15, 5);

// Endpoints that check an emailed code (on top of the per-code attempt limit)
export const codeCheckLimiter = limiter(15, 20);

// Deck generation calls Groq many times, so limit it per user (runs after requireAuth)
export const generateLimiter = limiter(60, 20, {
  keyGenerator: (req) => (req.userId ? `user:${req.userId}` : ipKeyGenerator(req.ip ?? '')),
});
