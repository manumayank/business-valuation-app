import React, { useState } from 'react';
import VACForm from '../components/VACForm';
import VACResults from '../components/VACResults';
import './VACPage.css';

const VACPage = () => {
  const [view, setView] = useState('form'); // 'form' or 'results'
  const [results, setResults] = useState(null);

  const handleComplete = (data) => {
    setResults(data);
    setView('results');
  };

  const handleNewCalculation = () => {
    setResults(null);
    setView('form');
  };

  const handleExport = () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!');
  };

  return (
    <div className="vac-page">
      <nav className="vac-nav">
        <div className="nav-brand">
          <span className="brand-icon">💼</span>
          <span className="brand-text">Value Acceleration Calculator</span>
        </div>
        <div className="nav-links">
          <button
            className={view === 'form' ? 'active' : ''}
            onClick={() => setView('form')}
          >
            Calculator
          </button>
          {results && (
            <button
              className={view === 'results' ? 'active' : ''}
              onClick={() => setView('results')}
            >
              Results
            </button>
          )}
        </div>
      </nav>

      <main className="vac-main">
        {view === 'form' && (
          <VACForm
            onComplete={handleComplete}
            onCancel={() => window.history.back()}
          />
        )}
        {view === 'results' && results && (
          <VACResults
            results={results}
            onNewCalculation={handleNewCalculation}
            onExport={handleExport}
          />
        )}
      </main>

      <footer className="vac-footer">
        <p>Value Acceleration Calculator - Business Valuation & Growth Analysis Tool</p>
      </footer>
    </div>
  );
};

export default VACPage;
