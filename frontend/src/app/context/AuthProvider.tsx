import React, { useState, useEffect, useCallback } from 'react';
import authService from '../../lib/auth-service';
import { type User, type UserRole, type LoginCredentials, type RegisterData } from '../../types/auth';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Re-hydrate session directly from HttpOnly session cookie on mount / refresh
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const freshUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(freshUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: RegisterData): Promise<User> => {
    const registeredUser = await authService.register(data);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      return authService.hasRole(user, roles);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // SPA authentication uses HttpOnly session cookie; no token stored in browser
        isAuthenticated: Boolean(user),
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

export default AuthProvider;
