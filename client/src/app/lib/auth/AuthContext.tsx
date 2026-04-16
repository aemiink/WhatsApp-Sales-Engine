import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiRequest,
  setTokensRefreshedHandler,
  setUnauthorizedHandler,
} from '../api/apiClient';
import { tokenStorage, type StoredTokens } from './tokenStorage';

export type AuthRole = 'admin' | 'agent' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthWorkspace {
  id: string;
  name: string;
  role: AuthRole;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  workspace: AuthWorkspace;
}

interface MeResponse {
  user: AuthUser;
  workspace: AuthWorkspace;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  workspace: AuthWorkspace | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<AuthWorkspace | null>(null);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setWorkspace(null);
    setStatus('unauthenticated');
  }, []);

  const applyLoginPayload = useCallback((payload: LoginResponse) => {
    const tokens: StoredTokens = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
    tokenStorage.write(tokens);
    setUser(payload.user);
    setWorkspace(payload.workspace);
    setStatus('authenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    if (!tokenStorage.read()) {
      setStatus('unauthenticated');
      return;
    }

    try {
      const data = await apiRequest<MeResponse>('/auth/me');
      setUser(data.user);
      setWorkspace(data.workspace);
      setStatus('authenticated');
    } catch {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const payload = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
        skipAuth: true,
      });
      applyLoginPayload(payload);
    },
    [applyLoginPayload],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    setTokensRefreshedHandler(() => {
      // Tokens persist via apiClient. No additional state change required.
    });
    return () => {
      setUnauthorizedHandler(null);
      setTokensRefreshedHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      workspace,
      login,
      logout,
      refreshSession,
    }),
    [status, user, workspace, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
