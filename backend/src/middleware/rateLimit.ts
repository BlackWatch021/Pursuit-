import rateLimit from 'express-rate-limit';

const minutes = (n: number) => n * 60 * 1000;

// Login / register: blunt password brute-forcing. Successful requests are not
// counted, so a legitimate user signing in and out repeatedly isn't penalised.
export const authLimiter = rateLimit({
  windowMs: minutes(15),
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' }),
});

// Password reset: stricter, and counts every request — limits OTP-email
// spamming and OTP guessing (on top of the per-account attempt cap).
export const passwordResetLimiter = rateLimit({
  windowMs: minutes(15),
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many requests. Please try again later.' }),
});
