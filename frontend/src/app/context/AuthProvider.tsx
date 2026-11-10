import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/axios';
import { type User, type UserRole } from '../../types/auth';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sentravax_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sentravax_auth_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial CSRF cookie for Sanctum SPA
  const initializeCsrf = async () => {
    try {
      const host = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
      await apiClient.get(`http://${host}:8000/sanctum/csrf-cookie`).catch(() => {
        // Fallback silently if direct token auth takes priority
      });
    } catch {
      // Ignore
    }
  };

  // Check current session on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('sentravax_auth_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data?.success && isMounted) {
          const remoteUser = response.data.data.user;
          setUser(remoteUser);
          localStorage.setItem('sentravax_user', JSON.stringify(remoteUser));
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('sentravax_auth_token');
          localStorage.removeItem('sentravax_user');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeCsrf();
    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    await initializeCsrf();

    const response = await apiClient.post('/auth/login', credentials);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Login gagal.');
    }

    const { user: authUser, token: authToken } = response.data.data;
    setUser(authUser);
    setToken(authToken);

    localStorage.setItem('sentravax_auth_token', authToken);
    localStorage.setItem('sentravax_user', JSON.stringify(authUser));

    return authUser;
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }): Promise<User> => {
    await initializeCsrf();

    const response = await apiClient.post('/auth/register', data);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Registrasi gagal.');
    }

    const { user: authUser, token: authToken } = response.data.data;
    setUser(authUser);
    setToken(authToken);

    localStorage.setItem('sentravax_auth_token', authToken);
    localStorage.setItem('sentravax_user', JSON.stringify(authUser));

    return authUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sentravax_auth_token');
      localStorage.removeItem('sentravax_user');
    }
  };

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

