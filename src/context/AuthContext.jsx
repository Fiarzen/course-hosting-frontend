import { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '../api/api';

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

  // Load user from localStorage on mount
  useEffect(() => {
    const storedCredentials = localStorage.getItem('auth_credentials');
    if (storedCredentials) {
      try {
        const { email, password } = JSON.parse(storedCredentials);
        // Set auth for all future requests
        usersApi.setAuth(email, password);
        // Verify credentials by getting current user
        usersApi.getCurrentUser(email, password)
          .then((userData) => {
            setUser(userData);
          })
          .catch(() => {
            // Invalid credentials, clear storage
            localStorage.removeItem('auth_credentials');
            usersApi.setAuth(null, null);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err) {
        localStorage.removeItem('auth_credentials');
        usersApi.setAuth(null, null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await usersApi.getCurrentUser(email, password);
      // Store credentials for future requests
      localStorage.setItem('auth_credentials', JSON.stringify({ email, password }));
      // Set auth for all future API requests
      usersApi.setAuth(email, password);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid email or password' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_credentials');
    usersApi.setAuth(null, null);
    setUser(null);
  };

  const refreshUser = async () => {
    const storedCredentials = localStorage.getItem('auth_credentials');
    if (storedCredentials) {
      try {
        const { email, password } = JSON.parse(storedCredentials);
        const userData = await usersApi.getCurrentUser(email, password);
        setUser(userData);
        return userData;
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
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

