/**
 * Valuation App Page
 *
 * Main application page after user authentication.
 * Contains the Wizard and Dashboard components.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Wizard from '../components/Wizard';
import Dashboard from '../components/Dashboard';
import '../App.css';

function ValuationApp() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [currentScreen, setCurrentScreen] = useState('wizard'); // 'wizard' or 'dashboard'
  const [userId, setUserId] = useState(user?.id);
  const [valuationId, setValuationId] = useState(null);
  const [valuation, setValuation] = useState(null);

  const handleWizardComplete = (valuationData, newValuationId) => {
    setValuation(valuationData);
    setValuationId(newValuationId);
    setCurrentScreen('dashboard');
  };

  const handleReturnToWizard = () => {
    setCurrentScreen('wizard');
  };

  const handleValuationUpdate = (updatedValuation) => {
    setValuation(updatedValuation);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Business Valuation & Improvement</h1>
              <p className="subtitle">Estimate your company value and identify growth opportunities</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                Welcome, <strong>{user?.fullName}</strong>
              </p>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '6px',
                  color: '#333',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {currentScreen === 'wizard' ? (
            <Wizard
              userId={userId}
              onComplete={handleWizardComplete}
            />
          ) : (
            <Dashboard
              valuation={valuation}
              valuationId={valuationId}
              onReturnToWizard={handleReturnToWizard}
              onValuationUpdate={handleValuationUpdate}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Business Valuation App. All valuations are estimates.</p>
      </footer>
    </div>
  );
}

export default ValuationApp;
