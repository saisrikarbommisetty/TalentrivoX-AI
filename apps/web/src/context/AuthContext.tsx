import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (fullName: string, email: string, password?: string, role?: string) => Promise<string | undefined>;
  demoLogin: (role?: 'recruiter' | 'job_seeker') => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'talentrivox_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem('avengercoders_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('avengercoders_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setToken(storedToken);
          localStorage.setItem(TOKEN_KEY, storedToken);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('avengercoders_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password?: string, role = 'recruiter') => {
    setIsLoading(true);
    try {
      const res = await api.signup(fullName, email, password, role);
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
      }
      return res.message;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'recruiter' | 'job_seeker' = 'recruiter') => {
    setIsLoading(true);
    try {
      const res = await api.demoLoginRole(role);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    const res = await api.forgotPassword(email);
    return res.message;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('avengercoders_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, demoLogin, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
