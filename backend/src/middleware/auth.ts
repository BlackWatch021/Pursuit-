import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { verifyToken } from '../utils/jwt';

/**
 * Requires a valid JWT, supplied either as an httpOnly cookie (preferred) or a
 * `Authorization: Bearer <token>` header. Attaches `req.userId` on success.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = req.cookies?.[config.cookieName] || bearer;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
