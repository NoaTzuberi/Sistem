import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  login as loginRequest,
  register as registerRequest,
  fetchCurrentUser,
} from './authService';
import type { AuthUser } from './authService';
import { getToken, setToken, clearToken } from './tokenStorage';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
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
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
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
  }

  async function register(payload: RegisterPayload) {
    const { token, user: registeredUser } = await registerRequest(payload);
    setToken(token);
    setUser(registeredUser);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  function updateUser(patch: Partial<AuthUser>) {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
