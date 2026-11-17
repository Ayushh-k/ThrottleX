import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('throttlex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('throttlex_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('throttlex_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res?.token && res?.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('throttlex_token', res.token);
      localStorage.setItem('throttlex_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('throttlex_token');
    localStorage.removeItem('throttlex_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('throttlex_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
