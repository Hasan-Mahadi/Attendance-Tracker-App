import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { Role } from '../config/constants.js';

/**
 * JWT access token payload structure.
 */
interface AccessTokenPayload {
  userId: string;
  employeeId: string;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware.
 * Extracts and verifies the JWT access token from the Authorization header.
 * Attaches the decoded user info to req.user on success.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;

    // Attach user information to request
    req.user = {
      id: decoded.userId,
      employeeId: decoded.employeeId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Access token has expired'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid access token'));
      return;
    }

    next(ApiError.unauthorized('Authentication failed'));
  }
}
