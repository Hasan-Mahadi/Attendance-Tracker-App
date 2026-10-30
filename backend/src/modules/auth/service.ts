import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  User,
  Employee,
  RefreshToken,
  EmployeeInvitation,
  IUser,
  IEmployee,
} from '../../models/index.js';
import {
  LOCKOUT,
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
  EmploymentStatuses,
} from '../../config/constants.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './validators.js';

export interface TokenPayload {
  userId: string;
  employeeId: string;
  role: string;
  email: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
    employee: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      designation?: string;
      department?: string;
      profileImage?: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  /**
   * Issue access and refresh tokens
   */
  static async issueTokens(
    user: IUser,
    employee: IEmployee,
    userAgent?: string,
    ipAddress?: string,
    existingFamily?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      employeeId: employee._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessSignOptions: SignOptions = {
      expiresIn: env.jwt.accessTokenTtl as any,
    };

    const accessToken = jwt.sign(payload, env.jwt.accessSecret, accessSignOptions);

    // Refresh token is a random 64-byte hex string
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const family = existingFamily || crypto.randomUUID();

    // Calculate expiry (e.g. 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      family,
      isRevoked: false,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  /**
   * Register with Employee ID and Invitation Code
   */
  static async register(input: RegisterInput, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    const employee = await Employee.findOne({
      employeeCode: input.employeeCode.trim().toUpperCase(),
    }).populate('department');

    if (!employee) {
      throw ApiError.badRequest('Invalid Employee ID or invitation credentials');
    }

    if (employee.employmentStatus !== EmploymentStatuses.ACTIVE) {
      throw ApiError.forbidden('Employee profile is not active. Please contact HR.');
    }

    // Check if user account already exists
    const existingUser = await User.findOne({ employeeId: employee._id });
    if (existingUser) {
      throw ApiError.conflict('An account has already been registered for this Employee ID');
    }

    // Verify invitation code
    const invitation = await EmployeeInvitation.findOne({
      employeeId: employee._id,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw ApiError.badRequest('Invalid or expired invitation credential');
    }

    // Compare invitation code
    const isCodeValid =
      invitation.invitationCode === input.invitationCode.trim() ||
      invitation.invitationCode === hashToken(input.invitationCode.trim());

    if (!isCodeValid) {
      throw ApiError.badRequest('Invalid invitation code');
    }

    // Create user account
    const user = new User({
      employeeId: employee._id,
      email: employee.email,
      passwordHash: input.password, // Pre-save hook hashes with bcrypt
      role: 'employee',
      isActive: true,
      lastLogin: new Date(),
    });

    await user.save();

    // Mark invitation used
    invitation.isUsed = true;
    invitation.usedAt = new Date();
    await invitation.save();

    const tokens = await this.issueTokens(user, employee, userAgent, ipAddress);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        employee: {
          id: employee._id.toString(),
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          designation: employee.designation,
          department: (employee.department as any)?.name,
          profileImage: employee.profileImage,
        },
      },
      ...tokens,
    };
  }

  /**
   * Login with Employee ID or Email and password
   */
  static async login(input: LoginInput, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    const query = input.employeeCode.trim();
    let employee: IEmployee | null = null;

    if (query.includes('@')) {
      employee = await Employee.findOne({ email: query.toLowerCase() }).populate('department');
    } else {
      employee = await Employee.findOne({ employeeCode: query.toUpperCase() }).populate('department');
    }

    if (!employee) {
      // Don't leak whether employee exists
      throw ApiError.unauthorized('Invalid login credentials');
    }

    const user = await User.findOne({ employeeId: employee._id }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid login credentials');
    }

    if (!user.isActive || employee.employmentStatus === EmploymentStatuses.TERMINATED || employee.employmentStatus === EmploymentStatuses.SUSPENDED) {
      throw ApiError.forbidden('Your account is inactive or suspended. Please contact HR.');
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMinutes = user.lockUntil
        ? Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60))
        : LOCKOUT.DURATION_MINUTES;
      throw ApiError.forbidden(
        `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    // Verify password
    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= LOCKOUT.MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT.DURATION_MINUTES * 60 * 1000);
      }
      await user.save();
      throw ApiError.unauthorized('Invalid login credentials');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const tokens = await this.issueTokens(user, employee, userAgent, ipAddress);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        employee: {
          id: employee._id.toString(),
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          designation: employee.designation,
          department: (employee.department as any)?.name,
          profileImage: employee.profileImage,
        },
      },
      ...tokens,
    };
  }

  /**
   * Refresh token rotation and reuse detection
   */
  static async refresh(rawRefreshToken: string, userAgent?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await RefreshToken.findOne({ tokenHash });

    if (!existingToken) {
      // Possible reuse of an already-deleted or forged token:
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Check reuse detection: If already revoked, compromise detected! Revoke entire family!
    if (existingToken.isRevoked) {
      await RefreshToken.updateMany({ family: existingToken.family }, { isRevoked: true });
      throw ApiError.unauthorized('Compromised session detected. Please log in again.');
    }

    // Check expiration
    if (new Date() > existingToken.expiresAt) {
      existingToken.isRevoked = true;
      await existingToken.save();
      throw ApiError.unauthorized('Refresh token has expired. Please log in again.');
    }

    // Revoke this current token as it is being used
    existingToken.isRevoked = true;
    await existingToken.save();

    // Find the user and employee
    const user = await User.findById(existingToken.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    const employee = await Employee.findById(user.employeeId);
    if (!employee || employee.employmentStatus !== EmploymentStatuses.ACTIVE) {
      throw ApiError.unauthorized('Employee not found or inactive');
    }

    // Issue new tokens under the SAME family
    return this.issueTokens(user, employee, userAgent, ipAddress, existingToken.family);
  }

  /**
   * Logout current session
   */
  static async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
  }

  /**
   * Logout all sessions for user
   */
  static async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
  }

  /**
   * Request password reset token
   */
  static async forgotPassword(input: ForgotPasswordInput): Promise<string | null> {
    const user = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (!user) {
      // Return null quietly to prevent email enumeration
      return null;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    return resetToken;
  }

  /**
   * Reset password with reset token
   */
  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const hashed = hashToken(input.token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordHash');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    user.passwordHash = input.newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all existing sessions
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  }

  /**
   * Change password for logged in user
   */
  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.comparePassword(input.currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password does not match');
    }

    user.passwordHash = input.newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate other refresh tokens
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  }
}
