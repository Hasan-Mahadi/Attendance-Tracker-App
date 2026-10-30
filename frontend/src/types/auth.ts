import type { UserRole, Employee } from './index';

// ============================================================================
// Auth User
// ============================================================================

export interface AuthUser {
  id: string;
  employee_id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  employee: {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    designation: string | null;
    department: {
      id: string;
      name: string;
    } | null;
    profile_image_url: string | null;
  };
}

// ============================================================================
// Auth Requests
// ============================================================================

export interface LoginRequest {
  employee_id: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: AuthUser;
  };
}

export interface RegisterRequest {
  employee_id: string;
  email: string;
  password: string;
  confirm_password: string;
  invitation_code: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: AuthUser;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
