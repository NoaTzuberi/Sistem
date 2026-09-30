import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, LoginPayload } from '@sistem/types';
import { login as loginRequest, fetchCurrentUser } from './authService';
import { getToken, setToken, clearToken } from './tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
