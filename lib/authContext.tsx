'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { user: storedUser, accessToken: token, refreshToken: refresh } = JSON.parse(stored);
        setUser(storedUser);
        setAccessToken(token);
        setRefreshToken(refresh);
      } catch (error) {
        console.error('Failed to load auth:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
    };
    setUser(userData);
    setAccessToken(response.access_token);
    setRefreshToken(response.refresh_token);
    localStorage.setItem('auth', JSON.stringify({
      user: userData,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    }));
  };

  const signup = async (email: string, password: string, name: string, phone: string) => {
    await authAPI.signup(email, password, name, phone);
    // After signup, user should verify email or login
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth');
  };

  const sendOtp = async (email: string) => {
    await authAPI.sendOtp(email);
  };

  const verifyOtp = async (email: string, token: string) => {
    const response = await authAPI.verifyOtp(email, token);
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
    };
    setUser(userData);
    setAccessToken(response.access_token);
    setRefreshToken(response.refresh_token);
    localStorage.setItem('auth', JSON.stringify({
      user: userData,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, refreshToken, login, signup, logout, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
