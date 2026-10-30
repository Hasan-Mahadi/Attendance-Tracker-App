'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api, {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from '../lib/api';

export interface CurrentUser {
  id: string;
  email: string;
  role: 'super_admin' | 'hr_admin' | 'employee';
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
    profileImage?: string;
  } | null;
}

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (employeeCode: string, password: string) => Promise<void>;
  register: (employeeCode: string, invitationCode: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isSuperAdmin: boolean;
  isHRAdmin: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('attendance_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Validate or restore authentication on mount
  const checkAuth = useCallback(async () => {
    const token = getAccessToken();
    const storedRefresh = getRefreshToken();

    // If no access token and no refresh token, user is definitely logged out
    if (!token && !storedRefresh) {
      setUser(null);
      clearTokens();
      setIsLoading(false);
      return;
    }

    try {
      if (token) {
        // We have an access token, try fetching profile directly
        const meRes = await api.get('/auth/me');
        if (meRes.data?.data) {
          setUser(meRes.data.data);
          localStorage.setItem('attendance_user', JSON.stringify(meRes.data.data));
          setIsLoading(false);
          return;
        }
      }

      // If token expired or missing, but we have a refresh token (or cookie)
      const res = await api.post('/auth/refresh', {
        refreshToken: storedRefresh || undefined,
      });

      const newAccessToken =
        res.data?.data?.accessToken || res.data?.data?.access_token;
      const newRefreshToken = res.data?.data?.refreshToken;

      if (newAccessToken) {
        setTokens(newAccessToken, newRefreshToken || storedRefresh);
        const meRes = await api.get('/auth/me');
        if (meRes.data?.data) {
          setUser(meRes.data.data);
          localStorage.setItem('attendance_user', JSON.stringify(meRes.data.data));
        }
      } else {
        throw new Error('Refresh failed');
      }
    } catch {
      // Failed to restore session
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (employeeCode: string, password: string) => {
    const res = await api.post('/auth/login', { employeeCode, password });
    const { accessToken, refreshToken, user: loggedUser } = res.data.data;
    setTokens(accessToken, refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_user', JSON.stringify(loggedUser));
    }
    setUser(loggedUser);
    router.push('/');
  };

  const register = async (employeeCode: string, invitationCode: string, password: string) => {
    const res = await api.post('/auth/register', { employeeCode, invitationCode, password });
    const { accessToken, refreshToken, user: registeredUser } = res.data.data;
    setTokens(accessToken, refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_user', JSON.stringify(registeredUser));
    }
    setUser(registeredUser);
    router.push('/');
  };

  const logout = async () => {
    const storedRefresh = getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken: storedRefresh || undefined });
    } catch {
      // ignore logout network errors
    } finally {
      clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('attendance_user', JSON.stringify(res.data.data));
        }
      }
    } catch {
      // ignore
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isHRAdmin = user?.role === 'hr_admin';
  const isAdmin = isSuperAdmin || isHRAdmin;
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
        isSuperAdmin,
        isHRAdmin,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
