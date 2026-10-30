import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware factory.
 * Returns middleware that checks if the authenticated user has one of the allowed roles.
 * Must be used after the `authenticate` middleware.
 *
 * @param allowedRoles - Roles permitted to access the route
 * @returns Express middleware function
 *
 * @example
 * router.get('/admin-only', authenticate, authorize('super_admin', 'hr_admin'), handler);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
}
