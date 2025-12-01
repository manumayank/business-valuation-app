import React, { useState } from 'react';
import '../styles/WorkingCapital.css';

const WorkingCapitalOptimization = ({ analysis, valuationId, onClose }) => {
  const [selectedScenario, setSelectedScenario] = useState('moderate');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarios, setScenarios] = useState(null);

  React.useEffect(() => {
    // Load optimization scenarios if not already loaded
    if (!scenarios && analysis) {
      loadScenarios();
    }
  }, []);

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      // Prepare input data from analysis
      const inputData = {
        accountsReceivable: analysis.metrics.dso.value * analysis.metrics.dso.benchmark,
        inventory: analysis.metrics.dio.value * analysis.metrics.dio.benchmark,
        accountsPayable: analysis.metrics.dpo.value * analysis.metrics.dpo.benchmark,
        costOfGoodsSold: 1000000, // Base assumption
        annualRevenue: 2000000, // Base assumption
        totalCurrentAssets: 500000,
        totalCurrentLiabilities: 200000,
        industry: analysis.industry
      };

      const response = await fetch(
        `${API_URL}/valuations/${valuationId}/working-capital/optimize`,
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
      }
    } catch (error) {
      console.error('Error loading optimization scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scenarioInfo = scenarios ? scenarios[selectedScenario] : null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getScenarioColor = (scenario) => {
    switch (scenario) {
      case 'conservative':
        return '#3b82f6';
      case 'moderate':
        return '#10b981';
      case 'aggressive':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="working-capital-optimization">
      <div className="wc-optimization-header">
        <h3>Working Capital Optimization Scenarios</h3>
        <p className="wc-subtitle">
          See how much cash you could release by optimizing your working capital
        </p>
      </div>

      {/* Scenario Tabs */}
      <div className="wc-scenario-tabs">
        {['conservative', 'moderate', 'aggressive'].map(scenario => (
          <button
            key={scenario}
            className={`wc-scenario-tab ${selectedScenario === scenario ? 'active' : ''}`}
            onClick={() => setSelectedScenario(scenario)}
            style={{
              borderBottomColor: selectedScenario === scenario ? getScenarioColor(scenario) : 'transparent'
            }}
          >
            <span className="scenario-icon">
              {scenario === 'conservative' && '📊'}
              {scenario === 'moderate' && '🎯'}
              {scenario === 'aggressive' && '🚀'}
            </span>
            <span className="scenario-label">
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Scenario Content */}
      {scenarioInfo && (
        <div className="wc-scenario-content">
          <div className="wc-scenario-description">
            {scenarioInfo.description}
          </div>

          {/* Key Metrics */}
          <div className="wc-scenario-metrics">
            <h4>Target Metrics</h4>
            <div className="wc-metrics-comparison">
              <div className="metric-comparison-item">
                <div className="metric-current">
                  <div className="metric-label">Current DSO</div>
                  <div className="metric-value">{analysis.metrics.dso.value}d</div>
                </div>
                <div className="metric-arrow">→</div>
                <div className="metric-target">
                  <div className="metric-label">Target DSO</div>
                  <div className="metric-value" style={{ color: getScenarioColor(selectedScenario) }}>
                    {scenarioInfo.metrics.dsoTarget}d
                  </div>
                </div>
              </div>

              <div className="metric-comparison-item">
                <div className="metric-current">
                  <div className="metric-label">Current DIO</div>
                  <div className="metric-value">{analysis.metrics.dio.value}d</div>
                </div>
                <div className="metric-arrow">→</div>
                <div className="metric-target">
                  <div className="metric-label">Target DIO</div>
                  <div className="metric-value" style={{ color: getScenarioColor(selectedScenario) }}>
                    {scenarioInfo.metrics.dioTarget}d
                  </div>
                </div>
              </div>

              <div className="metric-comparison-item">
                <div className="metric-current">
                  <div className="metric-label">Current DPO</div>
                  <div className="metric-value">{analysis.metrics.dpo.value}d</div>
                </div>
                <div className="metric-arrow">→</div>
                <div className="metric-target">
                  <div className="metric-label">Target DPO</div>
                  <div className="metric-value" style={{ color: getScenarioColor(selectedScenario) }}>
                    {scenarioInfo.metrics.dpoTarget}d
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Impact */}
          <div className="wc-financial-impact">
            <h4>Cash Release Impact</h4>
            <div className="impact-breakdown">
              <div className="impact-item">
                <div className="impact-source">From improving DSO</div>
                <div className="impact-amount">
                  {formatCurrency(scenarioInfo.projectedImpact.dsoReleasedCash)}
                </div>
              </div>
              <div className="impact-item">
                <div className="impact-source">From optimizing DIO</div>
                <div className="impact-amount">
                  {formatCurrency(scenarioInfo.projectedImpact.dioReleasedCash)}
                </div>
              </div>
              <div className="impact-item">
                <div className="impact-source">From extending DPO</div>
                <div className="impact-amount">
                  {formatCurrency(scenarioInfo.projectedImpact.dpoReleasedCash)}
                </div>
              </div>
            </div>

            <div className="impact-total">
              <div className="impact-total-label">Total Cash Released</div>
              <div className="impact-total-amount" style={{ color: getScenarioColor(selectedScenario) }}>
                {formatCurrency(scenarioInfo.projectedImpact.totalReleasedCash)}
              </div>
            </div>

            <div className="impact-valuation">
              <div className="impact-valuation-label">Estimated Valuation Increase</div>
              <div className="impact-valuation-amount" style={{ color: getScenarioColor(selectedScenario) }}>
                {formatCurrency(scenarioInfo.projectedImpact.estimatedValuationLift)}
              </div>
              <p className="impact-note">
                Based on 2.5x multiple applied to released cash
              </p>
            </div>
          </div>

          {/* Implementation Timeline */}
          <div className="wc-implementation-info">
            <h4>Implementation Approach</h4>
            <div className="implementation-content">
              <p>
                This {selectedScenario} scenario represents{' '}
                {selectedScenario === 'conservative' ? '50%' : selectedScenario === 'moderate' ? '100%' : '150%'}
                {' '}of the gap to industry benchmarks.
              </p>
              <p className="implementation-timeline">
                {selectedScenario === 'conservative' && (
                  <>
                    <strong>Timeline:</strong> 2-4 months to implement<br/>
                    <strong>Risk:</strong> Low - incremental improvements<br/>
                    <strong>Best for:</strong> Conservative businesses preferring gradual change
                  </>
                )}
                {selectedScenario === 'moderate' && (
                  <>
                    <strong>Timeline:</strong> 3-6 months to implement<br/>
                    <strong>Risk:</strong> Medium - balanced approach<br/>
                    <strong>Best for:</strong> Most businesses seeking meaningful improvement
                  </>
                )}
                {selectedScenario === 'aggressive' && (
                  <>
                    <strong>Timeline:</strong> 6-9 months to implement<br/>
                    <strong>Risk:</strong> Higher - transformative changes<br/>
                    <strong>Best for:</strong> Aggressive growth-focused businesses
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="wc-optimization-actions">
        <button className="wc-btn wc-btn-primary" onClick={onClose}>
          Apply This Scenario
        </button>
        <button className="wc-btn wc-btn-secondary" onClick={onClose}>
          Back to Analysis
        </button>
      </div>
    </div>
  );
};

export default WorkingCapitalOptimization;
