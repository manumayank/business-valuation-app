import React, { useState, useEffect } from 'react';
import './App.css';
import Wizard from './components/Wizard';
import Dashboard from './components/Dashboard';
import { createUserSession, checkHealth } from './services/api';

function App() {
  const [currentScreen, setCurrentScreen] = useState('wizard'); // 'wizard' or 'dashboard'
  const [userId, setUserId] = useState(null);
  const [valuationId, setValuationId] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Initialize user session on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check API health first
        await checkHealth();

        // Create user session
        const { userId: newUserId } = await createUserSession();
        setUserId(newUserId);
        setApiError(null);
      } catch (error) {
        setApiError('Failed to connect to the server. Please ensure the backend is running on http://localhost:5000');
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

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

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{apiError}</p>
          <p>Make sure to run the backend server first:</p>
          <code>cd backend && npm install && npm start</code>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Error</h2>
          <p>Failed to initialize the application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>Business Valuation & Improvement</h1>
          <p className="subtitle">Estimate your company value and identify growth opportunities</p>
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

export default App;
