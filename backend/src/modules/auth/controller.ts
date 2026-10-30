import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...(env.cookie.domain && { domain: env.cookie.domain }),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: '/',
    ...(env.cookie.domain && { domain: env.cookie.domain }),
  });
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await AuthService.register(req.body, userAgent, ipAddress);

      setRefreshCookie(res, result.refreshToken);

      ApiResponse.success(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Account registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await AuthService.login(req.body, userAgent, ipAddress);

      setRefreshCookie(res, result.refreshToken);

      ApiResponse.success(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;

      const tokens = await AuthService.refresh(refreshToken, userAgent, ipAddress);

      setRefreshCookie(res, tokens.refreshToken);

      ApiResponse.success(
        res,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        'Token refreshed successfully'
      );
    } catch (error) {
      clearRefreshCookie(res);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await AuthService.logout(refreshToken);
      clearRefreshCookie(res);
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await AuthService.logoutAll(req.user.id);
      }
      clearRefreshCookie(res);
      ApiResponse.success(res, null, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetToken = await AuthService.forgotPassword(req.body);

      // In development mode, we can return the token for testing if configured
      const responseData = env.isDevelopment && resetToken ? { resetToken } : null;

      ApiResponse.success(
        res,
        responseData,
        'If that email is registered, you will receive password reset instructions.'
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);
      clearRefreshCookie(res);
      ApiResponse.success(res, null, 'Password reset successful. Please log in with your new password.');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.changePassword(req.user!.id, req.body);
      clearRefreshCookie(res);
      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { User, Employee } = await import('../../models/index.js');
      const user = await User.findById(req.user!.id);
      if (!user) {
        ApiResponse.error(res, 'User not found', 404);
        return;
      }
      const employee = await Employee.findById(user.employeeId).populate('department');

      ApiResponse.success(
        res,
        {
          id: user._id,
          email: user.email,
          role: user.role,
          employee: employee
            ? {
                id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName,
                designation: employee.designation,
                department: (employee.department as any)?.name,
                profileImage: employee.profileImage,
              }
            : null,
        },
        'Current user retrieved'
      );
    } catch (error) {
      next(error);
    }
  }
}
