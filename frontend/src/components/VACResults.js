import React from 'react';
import './VACResults.css';

const VACResults = ({ results, onNewCalculation, onExport }) => {
  if (!results) return null;

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskColor = (category) => {
    switch (category) {
      case 'LOW': return '#38a169';
      case 'MEDIUM': return '#d69e2e';
      case 'HIGH': return '#e53e3e';
      default: return '#718096';
    }
  };

  const getRiskLabel = (category) => {
    switch (category) {
      case 'LOW': return 'Low Risk';
      case 'MEDIUM': return 'Medium Risk';
      case 'HIGH': return 'High Risk';
      default: return 'Unknown';
    }
  };

  return (
    <div className="vac-results-container">
      {/* Header */}
      <div className="vac-results-header">
        <div className="header-content">
          <h2>Value Acceleration Report</h2>
          {results.businessName && <p className="business-name">{results.businessName}</p>}
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onNewCalculation}>
            New Calculation
          </button>
          {onExport && (
            <button className="btn-primary" onClick={onExport}>
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="vac-metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">Current Enterprise Value</div>
          <div className="metric-value">{formatCurrency(results.currentValue?.currentValue)}</div>
          <div className="metric-detail">
            EBITDA: {formatCurrency(results.ebitda?.ebitda)} x {results.multiple?.multipleUsed?.toFixed(2)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Risk Score</div>
          <div className="metric-value" style={{ color: getRiskColor(results.riskScore?.category) }}>
            {results.riskScore?.totalScore || 0} / 70
          </div>
          <div className="metric-detail" style={{ color: getRiskColor(results.riskScore?.category) }}>
            {getRiskLabel(results.riskScore?.category)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">EBITDA Margin</div>
          <div className="metric-value">{formatPercent(results.ebitda?.margin)}</div>
          <div className="metric-detail">
            Method: {results.ebitda?.method === 'baseline' ? 'Baseline (11.5%)' : 'Actual'}
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-label">Potential Accelerated Value</div>
          <div className="metric-value">{formatCurrency(results.valueAcceleration?.acceleratedValue)}</div>
          <div className="metric-detail">
            +{formatCurrency(results.valueAcceleration?.totalUplift)} potential
          </div>
        </div>
      </div>

      {/* Risk Score Breakdown */}
      <div className="vac-section">
        <h3>Risk Assessment Breakdown</h3>
        <div className="risk-breakdown">
          <div className="risk-gauge">
            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${((results.riskScore?.totalScore || 0) / 70) * 100}%`,
                  background: getRiskColor(results.riskScore?.category)
                }}
              />
            </div>
            <div className="gauge-labels">
              <span>High Risk (1)</span>
              <span>Low Risk (70)</span>
            </div>
          </div>

          {results.riskScore?.breakdown && (
            <div className="risk-scores-grid">
              {Object.entries(results.riskScore.breakdown).map(([key, value]) => (
                <div key={key} className="risk-item">
                  <span className="risk-question">{key.toUpperCase()}</span>
                  <span className="risk-score">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Value Acceleration Levers */}
      {results.valueAcceleration && (
        <div className="vac-section">
          <h3>Value Acceleration Levers</h3>
          <div className="levers-grid">
            <div className="lever-card">
              <div className="lever-icon">📈</div>
              <div className="lever-name">Size Lever</div>
              <div className="lever-description">Revenue Growth Impact</div>
              <div className="lever-value">+{formatCurrency(results.valueAcceleration.sizeLever?.valueIncrease)}</div>
              <div className="lever-detail">
                New Value: {formatCurrency(results.valueAcceleration.sizeLever?.newValue)}
              </div>
            </div>

            <div className="lever-card">
              <div className="lever-icon">⚡</div>
              <div className="lever-name">Efficiency Lever</div>
              <div className="lever-description">EBITDA Improvement</div>
              <div className="lever-value">+{formatCurrency(results.valueAcceleration.efficiencyLever?.valueIncrease)}</div>
              <div className="lever-detail">
                New EBITDA: {formatCurrency(results.valueAcceleration.efficiencyLever?.newEbitda)}
              </div>
            </div>

            <div className="lever-card">
              <div className="lever-icon">🎯</div>
              <div className="lever-name">Multiple Lever</div>
              <div className="lever-description">Multiple Enhancement</div>
              <div className="lever-value">+{formatCurrency(results.valueAcceleration.multipleLever?.valueIncrease)}</div>
              <div className="lever-detail">
                New Multiple: {results.valueAcceleration.multipleLever?.newMultiple?.toFixed(2)}x
              </div>
            </div>
          </div>

          <div className="combined-impact">
            <div className="impact-label">Combined Acceleration Impact</div>
            <div className="impact-value">
              {formatCurrency(results.currentValue?.currentValue)} → {formatCurrency(results.valueAcceleration.acceleratedValue)}
            </div>
            <div className="impact-percent">
              +{formatPercent(results.valueAcceleration.totalUplift / results.currentValue?.currentValue)} increase
            </div>
          </div>
        </div>
      )}

      {/* Probability Distribution */}
      {results.probabilityDistribution && (
        <div className="vac-section">
          <h3>Valuation Probability Distribution</h3>
          <div className="probability-chart">
            {results.probabilityDistribution.bands?.map((band, index) => (
              <div key={index} className="prob-bar-container">
                <div className="prob-label">{band.label}</div>
                <div className="prob-bar-wrapper">
                  <div
                    className="prob-bar"
                    style={{ width: `${band.probability * 100}%` }}
                  />
                </div>
                <div className="prob-value">{formatCurrency(band.value)}</div>
                <div className="prob-percent">{(band.probability * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="expected-value">
            <span>Expected Value:</span>
            <strong>{formatCurrency(results.probabilityDistribution.expectedValue)}</strong>
          </div>
        </div>
      )}

      {/* Wealth Gap Analysis */}
      {results.wealthGap && (
        <div className="vac-section">
          <h3>Wealth Gap Analysis</h3>
          <div className="wealth-gap-summary">
            <div className="wealth-metric">
              <div className="wealth-label">Current Value</div>
              <div className="wealth-value">{formatCurrency(results.wealthGap.currentValue)}</div>
            </div>

            {results.wealthGap.targetWealth && (
              <>
                <div className="wealth-arrow">→</div>
                <div className="wealth-metric">
                  <div className="wealth-label">Target Wealth</div>
                  <div className="wealth-value">{formatCurrency(results.wealthGap.targetWealth)}</div>
                </div>
                <div className="wealth-metric highlight">
                  <div className="wealth-label">Gap</div>
                  <div className="wealth-value">{formatCurrency(results.wealthGap.gap)}</div>
                </div>
                {results.wealthGap.yearsToTarget !== Infinity && (
                  <div className="wealth-metric">
                    <div className="wealth-label">Years to Target</div>
                    <div className="wealth-value">{results.wealthGap.yearsToTarget?.toFixed(1)} years</div>
                  </div>
                )}
              </>
            )}
          </div>

          {results.wealthGap.projection && results.wealthGap.projection.length > 0 && (
            <div className="projection-table">
              <h4>Value Projection</h4>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Projected Value</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {results.wealthGap.projection.map((row, index) => (
                    <tr key={index}>
                      <td>Year {row.year}</td>
                      <td>{formatCurrency(row.value)}</td>
                      <td>+{formatPercent(results.wealthGap.growthRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="vac-summary">
        <h3>Key Insights</h3>
        <ul className="insights-list">
          <li>
            <strong>Current Position:</strong> Your business is valued at {formatCurrency(results.currentValue?.currentValue)} based on
            {results.ebitda?.method === 'baseline' ? ' estimated baseline' : ' actual'} EBITDA of {formatCurrency(results.ebitda?.ebitda)}.
          </li>
          <li>
            <strong>Risk Profile:</strong> With a risk score of {results.riskScore?.totalScore}/70, your business falls in
            the {getRiskLabel(results.riskScore?.category).toLowerCase()} category.
          </li>
          {results.valueAcceleration?.totalUplift > 0 && (
            <li>
              <strong>Growth Potential:</strong> By implementing the three value acceleration levers, you could potentially
              increase your business value by {formatCurrency(results.valueAcceleration.totalUplift)}
              ({formatPercent(results.valueAcceleration.totalUplift / results.currentValue?.currentValue)}).
            </li>
          )}
          {results.wealthGap?.yearsToTarget && results.wealthGap.yearsToTarget !== Infinity && (
            <li>
              <strong>Timeline:</strong> At the current growth rate, you could reach your target wealth
              of {formatCurrency(results.wealthGap.targetWealth)} in approximately {results.wealthGap.yearsToTarget.toFixed(1)} years.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default VACResults;
