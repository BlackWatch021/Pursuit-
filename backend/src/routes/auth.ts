import bcrypt from 'bcryptjs';
import { Response, Router } from 'express';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { createDefaultBoard } from '../utils/seed';
import { loginSchema, registerSchema } from '../validators/schemas';

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

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');
    res.json({ user: user.toJSON() });
  }),
);

export default router;
