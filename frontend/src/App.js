import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ValuationApp from './pages/ValuationApp';
import VACPage from './pages/VACPage';
import EngagementPage from './pages/EngagementPage';
import AdvisorDashboard from './pages/AdvisorDashboard';
import BusinessPortal from './pages/BusinessPortal';
import AdminDashboard from './pages/AdminDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Services
import { checkHealth } from './services/api';

function App() {
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  // Check API health on app load
  useEffect(() => {
    const checkAPI = async () => {
      try {
        await checkHealth();
        setApiError(null);
      } catch (error) {
        setApiError(
          'Backend server is not running. Please start it with: cd backend && npm start'
        );
        console.error('API health check failed:', error);
      } finally {
        setApiLoading(false);
      }
    };

    checkAPI();
  }, []);

  // Show API error if backend is down
  if (apiError && !apiLoading) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>⚠️ Connection Error</h2>
          <p>{apiError}</p>
          <code>cd backend && npm install && npm start</code>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            The frontend is running, but it needs the backend server to function.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdvisorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Main entry point - Advisor Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdvisorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Legacy Valuation App (wizard) */}
            <Route
              path="/valuation"
              element={
                <ProtectedRoute>
                  <ValuationApp />
                </ProtectedRoute>
              }
            />

            {/* VAC (Value Acceleration Calculator) Route */}
            <Route
              path="/vac"
              element={
                <ProtectedRoute>
                  <VACPage />
                </ProtectedRoute>
              }
            />

            {/* Engagement Detail Page */}
            <Route
              path="/engagements/:engagementId"
              element={
                <ProtectedRoute>
                  <EngagementPage />
                </ProtectedRoute>
              }
            />

            {/* Business Portal - Public with access token */}
            <Route path="/business-portal/:accessToken" element={<BusinessPortal />} />

            {/* Admin Dashboard - Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home or login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
