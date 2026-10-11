import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithOtp: (email: string, otp: string) => Promise<User>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  register: (data: any) => Promise<{ requiresOtp: boolean; email: string }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toastMessage: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aagam_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const refreshUser = async () => {
    try {
      if (!localStorage.getItem('aagam_auth_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      localStorage.removeItem('aagam_auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('aagam_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.full_name}!`, 'success');
      return res.user;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const loginWithOtp = async (email: string, otp: string): Promise<User> => {
    const res = await api.verifyOtpLogin({ email, otp });
    if (res.success && res.token) {
      localStorage.setItem('aagam_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.full_name}!`, 'success');
      return res.user;
    }
    throw new Error(res.message || 'OTP login failed.');
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    showToast(res.message || 'Registration initiated. Please verify OTP.', 'info');
    return { requiresOtp: true, email: res.email };
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    const res = await api.verifyRegistrationOtp({ email, otp });
    if (res.success && res.token) {
      localStorage.setItem('aagam_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast('Email verified successfully! Welcome to AAGAM.', 'success');
    }
  };

  const logout = () => {
    localStorage.removeItem('aagam_auth_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithOtp,
        setUser,
        register,
        verifyRegistrationOtp,
        logout,
        refreshUser,
        toast: showToast,
        toastMessage,
      }}
    >
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
