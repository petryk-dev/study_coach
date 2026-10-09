import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { codeCheckLimiter, emailLimiter, loginLimiter, registerLimiter } from '../middlewares/rateLimit';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema';
import * as auth from '../services/auth.service';
import { revokeRefreshToken, rotateRefreshToken } from '../services/token.service';

const router = Router();

// 1. Create account and email a 6-digit code
router.post('/register', registerLimiter, validate(registerSchema), async (req, res) => {
  const user = await auth.register(req.body);
  res.status(201).json({ user, message: 'Verification code sent to your email' });
});

// 2. Confirm the code; logs the user in
router.post('/verify-email', codeCheckLimiter, validate(verifyEmailSchema), async (req, res) => {
  res.json(await auth.verifyEmail(req.body));
});

router.post('/resend-code', emailLimiter, validate(resendCodeSchema), async (req, res) => {
  await auth.resendCode(req.body.email);
  res.json({ message: 'If the account exists and is not verified, a new code was sent' });
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  res.json(await auth.login(req.body));
});

// Password reset: 1. email a code, 2. set a new password with it
router.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), async (req, res) => {
  await auth.forgotPassword(req.body.email);
  res.json({ message: 'If the account exists, a password reset code was sent' });
});

router.post('/reset-password', codeCheckLimiter, validate(resetPasswordSchema), async (req, res) => {
  await auth.resetPassword(req.body);
  res.json({ message: 'Password updated. Please log in with your new password' });
});

// Exchange a refresh token for a new access + refresh token pair
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  res.json(await rotateRefreshToken(req.body.refreshToken));
});

router.post('/logout', validate(refreshSchema), async (req, res) => {
  await revokeRefreshToken(req.body.refreshToken);
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await auth.getUser(req.userId!) });
});

export default router;
