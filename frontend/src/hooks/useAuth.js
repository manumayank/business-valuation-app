/**
 * useAuth Hook
 *
 * Custom hook to use authentication context easily in components.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */

import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>'
    );
  }

  return context;
};

export default useAuth;
