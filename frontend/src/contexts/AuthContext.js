/**
 * Auth Context
 *
 * Manages authentication state globally:
 * - Current user info
 * - Authentication status
 * - Login/logout/register functions
 * - Token management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, refreshAccessToken } from '../services/api';

export const AuthContext = createContext();

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Register new user
   */
  const register = async (email, password, fullName, company = '') => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerUser(email, password, fullName, company);

      // Save tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);

      return response.user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with credentials
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);

      // Save tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);

      return response.user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear state and storage
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  /**
   * Update user info (when user data changes)
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    // State
    user,
    isAuthenticated,
    loading,
    error,

    // Methods
    register,
    login,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
