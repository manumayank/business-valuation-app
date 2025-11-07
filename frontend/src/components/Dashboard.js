import React, { useState } from 'react';
import './Dashboard.css';
import { markImprovementAsCompleted, updateValuation, getValuation } from '../services/api';

const Dashboard = ({ valuation, valuationId, onReturnToWizard, onValuationUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMarkAsCompleted = async (improvementKey) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await markImprovementAsCompleted(valuationId, improvementKey);
      onValuationUpdate(updated);
    } catch (err) {
      setError('Failed to mark improvement as completed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWizard = () => {
    setLoading(true);
    onReturnToWizard();
  };

  if (!valuation) {
    return (
      <div className="dashboard">
        <p>Loading valuation...</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const completedImprovements = valuation.completedImprovements || [];
  const remainingSuggestions = (valuation.suggestions || []).filter(
    s => !completedImprovements.includes(s.key)
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{valuation.companyName}</h2>
        <p className="industry-badge">{valuation.industry}</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {/* Main Valuation Card */}
      <div className="valuation-card">
        <div className="valuation-content">
          <h3>Estimated Business Valuation</h3>
          <div className="valuation-amount">
            {formatCurrency(valuation.finalValuation)}
          </div>
          <p className="valuation-date">
            Calculated on {formatDate(valuation.calculationDate)}
          </p>
          <p className="valuation-note">
            This is an estimate based on industry benchmarks and your company metrics.
          </p>
        </div>
      </div>

      {/* Key Drivers Section */}
      <section className="dashboard-section">
        <h3 className="section-title">Value Drivers - What's Working Well</h3>
        <div className="drivers-grid">
          {(valuation.drivers || []).map((driver) => (
            <div key={driver.key} className="driver-card">
              <div className="driver-icon">✓</div>
              <h4>{driver.label}</h4>
              <p className="driver-impact">
                +{formatCurrency(Math.abs(driver.impact))}
              </p>
            </div>
          ))}
        </div>
        {(!valuation.drivers || valuation.drivers.length === 0) && (
          <p className="empty-state">No positive drivers identified</p>
        )}
      </section>

      {/* Gaps & Opportunities Section */}
      <section className="dashboard-section">
        <h3 className="section-title">Gaps vs Industry Benchmarks</h3>
        <div className="gaps-list">
          {(valuation.gaps || []).map((gap) => (
            <div key={gap.key} className="gap-item">
              <div className="gap-header">
                <h4>{gap.label}</h4>
                <span className="gap-badge">Gap: {gap.gap}</span>
              </div>
              <div className="gap-details">
                <div className="gap-metric">
                  <span className="label">Your {gap.label.toLowerCase()}:</span>
                  <span className="value">{gap.current}</span>
                </div>
                <div className="gap-metric">
                  <span className="label">Industry average:</span>
                  <span className="value">{gap.benchmark}</span>
                </div>
              </div>
              <p className="gap-impact">
                Impact on valuation: -{formatCurrency(Math.abs(gap.impact))}
              </p>
            </div>
          ))}
        </div>
        {(!valuation.gaps || valuation.gaps.length === 0) && (
          <p className="empty-state">Great! No significant gaps identified</p>
        )}
      </section>

      {/* Improvement Suggestions */}
      <section className="dashboard-section">
        <h3 className="section-title">Recommended Improvements</h3>
        <div className="suggestions-list">
          {remainingSuggestions.length > 0 ? (
            remainingSuggestions.map((suggestion) => (
              <div key={suggestion.key} className="suggestion-card">
                <div className="suggestion-header">
                  <h4>{suggestion.title}</h4>
                </div>
                <p className="suggestion-description">{suggestion.description}</p>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleMarkAsCompleted(suggestion.key)}
                  disabled={loading}
                >
                  Mark as Completed
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">All improvements completed! 🎉</p>
          )}
        </div>
      </section>

      {/* Completed Improvements */}
      {completedImprovements.length > 0 && (
        <section className="dashboard-section">
          <h3 className="section-title">Completed Improvements</h3>
          <div className="completed-improvements">
            {(valuation.suggestions || [])
              .filter(s => completedImprovements.includes(s.key))
              .map((suggestion) => (
                <div key={suggestion.key} className="completed-item">
                  <span className="check-mark">✓</span>
                  <span>{suggestion.title}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button
          className="btn btn-secondary"
          onClick={handleReturnToWizard}
          disabled={loading}
        >
          Update Data & Recalculate
        </button>
        <button
          className="btn btn-secondary"
          disabled={true}
          title="Coming soon"
        >
          Export Report (PDF)
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
