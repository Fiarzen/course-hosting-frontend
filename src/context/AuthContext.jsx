import { createContext, useContext, useState, useEffect } from 'react';
import api, { usersApi, authApi } from '../api/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount (token-based)
  useEffect(() => {
    const stored = localStorage.getItem('auth_data');
    if (stored) {
      try {
        const { token, user: storedUser } = JSON.parse(stored);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(storedUser);
      } catch (err) {
        localStorage.removeItem('auth_data');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user: userData } = await authApi.login(email, password);

      // Store token + user for future sessions
      localStorage.setItem('auth_data', JSON.stringify({ token, user: userData }));

      // Set Authorization header for all future API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid email or password',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_data');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const stored = localStorage.getItem('auth_data');
      if (!stored) return;
      const { token } = JSON.parse(stored);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = await usersApi.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

