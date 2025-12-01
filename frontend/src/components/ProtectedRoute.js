/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected component
  return children;
}

export default ProtectedRoute;
