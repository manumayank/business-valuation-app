import React, { useState, useEffect } from 'react';
import '../styles/DealAnalysis.css';

const DealScenarios = ({ valuationId, inputData, onClose }) => {
  const [scenarios, setScenarios] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('moderate');

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/valuations/${valuationId}/deal/scenarios`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(inputData)
        }
      );

      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
      } else {
        setError('Failed to load scenarios');
      }
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError('Error loading scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return <div className="deal-loading">Loading scenarios...</div>;
  }

  if (error || !scenarios) {
    return <div className="deal-error-state">{error || 'No scenarios available'}</div>;
  }

  const current = scenarios[selectedScenario];
  if (!current || !current.analysis) {
    return <div className="deal-error-state">Scenario data not available</div>;
  }

  const getScenarioColor = (scenario) => {
    switch (scenario) {
      case 'bullish': return '#10b981';
      case 'moderate': return '#3b82f6';
      case 'bearish': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getScenarioIcon = (scenario) => {
    switch (scenario) {
      case 'bullish': return '🚀';
      case 'moderate': return '🎯';
      case 'bearish': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="deal-scenarios-container">
      <h3 className="deal-section-title">📊 Deal Scenarios</h3>

      {/* Scenario Tabs */}
      <div className="scenario-tabs">
        {['bullish', 'moderate', 'bearish'].map(scenario => (
          <button
            key={scenario}
            className={`scenario-tab ${selectedScenario === scenario ? 'active' : ''}`}
            onClick={() => setSelectedScenario(scenario)}
            style={{
              borderBottomColor: selectedScenario === scenario ? getScenarioColor(scenario) : 'transparent'
            }}
          >
            <span className="scenario-icon">{getScenarioIcon(scenario)}</span>
            <span className="scenario-name">
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Scenario Description */}
      <div className="scenario-description">
        <p>{current.description}</p>
      </div>

      {/* Scenario Metrics */}
      <div className="scenario-metrics-grid">
        <div className="scenario-metric">
          <div className="metric-label">Expected ROI</div>
          <div className="metric-value" style={{ color: getScenarioColor(selectedScenario) }}>
            {current.analysis.roiAnalysis.expectedROIPercent}%
          </div>
        </div>

        <div className="scenario-metric">
          <div className="metric-label">Payback Period</div>
          <div className="metric-value">{current.analysis.roiAnalysis.paybackPeriod} yrs</div>
        </div>

        <div className="scenario-metric">
          <div className="metric-label">NPV</div>
          <div className="metric-value">
            {formatCurrency(current.analysis.roiAnalysis.npv)}
          </div>
        </div>

        <div className="scenario-metric">
          <div className="metric-label">Total Synergies</div>
          <div className="metric-value">
            {formatCurrency(current.analysis.synergies.totalSynergies)}
          </div>
        </div>

        <div className="scenario-metric">
          <div className="metric-label">Risk Score</div>
          <div className="metric-value">
            {current.analysis.riskAssessment.overallRiskScore}/100
          </div>
        </div>

        <div className="scenario-metric">
          <div className="metric-label">Overall Score</div>
          <div className="metric-value" style={{ color: getScenarioColor(selectedScenario) }}>
            {current.analysis.dealScorecard.overallScore.toFixed(2)}/10
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="scenario-recommendation">
        <h4>Recommendation: {current.analysis.dealScorecard.recommendationLevel}</h4>
        <p>{current.analysis.dealScorecard.rationale}</p>
      </div>

      {/* Scenario Comparison Table */}
      <div className="scenario-comparison">
        <h4>Scenario Comparison</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th style={{ color: getScenarioColor('bearish') }}>Bearish</th>
              <th style={{ color: getScenarioColor('moderate') }}>Base Case</th>
              <th style={{ color: getScenarioColor('bullish') }}>Bullish</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Expected ROI</td>
              <td>{scenarios.bearish.analysis.roiAnalysis.expectedROIPercent}%</td>
              <td>{scenarios.moderate.analysis.roiAnalysis.expectedROIPercent}%</td>
              <td>{scenarios.bullish.analysis.roiAnalysis.expectedROIPercent}%</td>
            </tr>
            <tr>
              <td>Payback Period</td>
              <td>{scenarios.bearish.analysis.roiAnalysis.paybackPeriod} yrs</td>
              <td>{scenarios.moderate.analysis.roiAnalysis.paybackPeriod} yrs</td>
              <td>{scenarios.bullish.analysis.roiAnalysis.paybackPeriod} yrs</td>
            </tr>
            <tr>
              <td>NPV (5-year)</td>
              <td>{formatCurrency(scenarios.bearish.analysis.roiAnalysis.npv)}</td>
              <td>{formatCurrency(scenarios.moderate.analysis.roiAnalysis.npv)}</td>
              <td>{formatCurrency(scenarios.bullish.analysis.roiAnalysis.npv)}</td>
            </tr>
            <tr>
              <td>Synergies</td>
              <td>{formatCurrency(scenarios.bearish.analysis.synergies.totalSynergies)}</td>
              <td>{formatCurrency(scenarios.moderate.analysis.synergies.totalSynergies)}</td>
              <td>{formatCurrency(scenarios.bullish.analysis.synergies.totalSynergies)}</td>
            </tr>
            <tr>
              <td>Risk Score</td>
              <td>{scenarios.bearish.analysis.riskAssessment.overallRiskScore}</td>
              <td>{scenarios.moderate.analysis.riskAssessment.overallRiskScore}</td>
              <td>{scenarios.bullish.analysis.riskAssessment.overallRiskScore}</td>
            </tr>
            <tr>
              <td>Recommendation</td>
              <td>{scenarios.bearish.analysis.dealScorecard.recommendationLevel}</td>
              <td>{scenarios.moderate.analysis.dealScorecard.recommendationLevel}</td>
              <td>{scenarios.bullish.analysis.dealScorecard.recommendationLevel}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="scenario-actions">
        <button className="deal-btn deal-btn-primary" onClick={onClose}>
          Back to Analysis
        </button>
      </div>
    </div>
  );
};

export default DealScenarios;
