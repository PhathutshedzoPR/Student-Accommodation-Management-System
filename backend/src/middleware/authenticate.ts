import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Verifies the Bearer JWT on the Authorization header and attaches the
 * decoded { userId, role } payload to req.user. Every protected route goes
 * through this first, then requireRole for anything role-specific.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorised: no token provided' });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorised: token expired or invalid' });
  }
}
