import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, AuthState } from '@/types/types';
import {
  login as loginService,
  logout as logoutService,
  getSession,
  getStoredUser,
  getStoredToken,
  clearAuth,
} from '@/services/auth.service';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const session = await getSession();
      setUser(session.user);
      setToken(storedToken);
      setIsAuthenticated(true);
    } catch {
      clearAuth();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginService(email, password);
      setUser(response.user);
      setToken(response.token);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutService();
    } catch {
      // Clear auth state even if the API call fails
    } finally {
      clearAuth();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;