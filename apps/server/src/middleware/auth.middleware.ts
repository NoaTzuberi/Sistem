import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@sistem/types';
import { config } from '../config/env';
import { User } from '../features/users/user.model';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * Use after requireAuth. The role is read from the database on every request (not
 * from the JWT), so promoting or demoting a user takes effect without a new token.
 */
export function requireRole(role: UserRole) {
  return async function requireRoleMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const user = await User.findById(req.userId).select('role');
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired token.' });
      return;
    }

    if (user.role !== role) {
      res.status(403).json({ message: 'You do not have access to this resource.' });
      return;
    }

    req.userRole = user.role;
    next();
  };
}
