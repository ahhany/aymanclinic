import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { API_BASE } from '../db/apiClient';

export interface AuthUser {
  id: string;
  name: string;
  role: 'doctor' | 'reception' | 'assistant' | string;
  email: string;
}

interface AuthState {
  user: AuthUser;
  token: string;
}

interface AuthContextValue {
  state: AuthState | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'aymanclinic.auth';
const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(loadStored);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('invalid_credentials');
    const data = (await res.json()) as AuthState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setState(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
