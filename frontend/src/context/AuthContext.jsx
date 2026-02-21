import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('ddas_token'));
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('ddas_user');
    return cached ? JSON.parse(cached) : null;
  });

  const login = async (usid, password) => {
    const res = await api.login({ usid, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('ddas_token', res.data.token);
    localStorage.setItem('ddas_user', JSON.stringify(res.data.user));
  };

  const logout = async () => {
    try {
      await api.logout(token);
    } catch (_) {
      // Ignore logout network failures for UX continuity.
    }
    localStorage.removeItem('ddas_token');
    localStorage.removeItem('ddas_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
