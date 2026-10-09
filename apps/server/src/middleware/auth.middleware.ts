import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@sistem/types';
import { config } from '../config/env';
import { User } from '../features/users/user.model';
import { sendError } from '../i18n';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  /** Set by loadCoachTrainee: a trainee the calling coach is allowed to see. */
  traineeId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'auth_required');
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    sendError(res, 401, 'invalid_token');
  }
}

/**
 * Use after requireAuth. The role is read from the database on every request (not
 * from the JWT), so promoting or demoting a user takes effect without a new token.
 */
export function requireRole(role: UserRole) {
  return async function requireRoleMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.userId) {
      sendError(res, 401, 'auth_required');
      return;
    }

    const user = await User.findById(req.userId).select('role');
    if (!user) {
      sendError(res, 401, 'invalid_token');
      return;
    }

    if (user.role !== role) {
      sendError(res, 403, 'forbidden');
      return;
    }

    req.userRole = user.role;
    next();
  };
}
