import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/**
 * requireRole('ADMIN') or requireRole('ADMIN', 'SECURITY'). Must run after
 * `authenticate`. This is the real enforcement boundary between the three
 * portals — the frontend route guards are just UX, this is what actually
 * stops a resident token from hitting an admin endpoint.
 */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorised' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
