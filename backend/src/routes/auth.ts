import bcrypt from 'bcryptjs';
import { Response, Router } from 'express';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { createDefaultBoard } from '../utils/seed';
import { sendMail, passwordResetEmail } from '../utils/mailer';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../validators/schemas';

const router = Router();

function setAuthCookie(res: Response, token: string) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? 'none' : 'lax',
    maxAge: config.jwtExpiresInSeconds * 1000,
    path: '/',
  });
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) throw new HttpError(409, 'An account with that email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    await createDefaultBoard(user.id);

    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user: user.toJSON() });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) throw new HttpError(401, 'Invalid email or password');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid email or password');

    setAuthCookie(res, signToken(user.id));
    res.json({ user: user.toJSON() });
  }),
);

router.post('/logout', (_req, res) => {
  res.clearCookie(config.cookieName, { path: '/' });
  res.json({ ok: true });
});

// Request a password-reset OTP. Always responds 200 so we never reveal whether
// an email is registered.
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
      user.resetOtpHash = await bcrypt.hash(otp, 10);
      user.resetOtpExpires = new Date(Date.now() + config.otpTtlMinutes * 60 * 1000);
      user.resetOtpAttempts = 0;
      await user.save();

      const mail = passwordResetEmail(otp);
      await sendMail({ to: user.email, ...mail });
    }
    res.json({ ok: true });
  }),
);

// Verify the OTP and set a new password.
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });

    const invalid = () => new HttpError(400, 'Invalid or expired code');
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) throw invalid();
    if (user.resetOtpExpires.getTime() < Date.now()) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      throw invalid();
    }
    if ((user.resetOtpAttempts ?? 0) >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      throw new HttpError(429, 'Too many attempts — request a new code');
    }

    const ok = await bcrypt.compare(otp, user.resetOtpHash);
    if (!ok) {
      user.resetOtpAttempts = (user.resetOtpAttempts ?? 0) + 1;
      await user.save();
      throw invalid();
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    setAuthCookie(res, signToken(user.id));
    res.json({ user: user.toJSON() });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');
    res.json({ user: user.toJSON() });
  }),
);

// Update name / avatar (no password required).
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');
    if (data.name !== undefined) user.name = data.name;
    if (data.image !== undefined) user.image = data.image || undefined;
    await user.save();
    res.json({ user: user.toJSON() });
  }),
);

// Change email — requires the current password and must stay unique.
router.patch(
  '/email',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { email, currentPassword } = updateEmailSchema.parse(req.body);
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Current password is incorrect');

    const normalized = email.toLowerCase();
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized });
      if (existing) throw new HttpError(409, 'An account with that email already exists');
      user.email = normalized;
      await user.save();
    }
    res.json({ user: user.toJSON() });
  }),
);

// Change password — verifies the current password first.
router.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  }),
);

export default router;
