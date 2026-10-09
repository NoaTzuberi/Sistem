import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, LoginPayload } from '@sistem/types';
import { useUserLanguage } from '@sistem/shared';
import { login as loginRequest, fetchCurrentUser } from './authService';
import { getToken, setToken, clearToken } from './tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Her saved language wins over the device's once she is signed in (Phase 15).
  useUserLanguage(user?.language);

  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }

      try {
        setUser(await fetchCurrentUser());
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(payload: LoginPayload) {
    const { token, user: loggedInUser } = await loginRequest(payload);
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  function updateUser(patch: Partial<AuthUser>) {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
