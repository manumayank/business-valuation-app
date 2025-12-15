import React from 'react';
import './VACResults.css';

const VACResults = ({ results, onNewCalculation, onExport }) => {
  if (!results) return null;

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null || isNaN(value)) return null;
    return `${(value * 100).toFixed(1)}%`;
  };

  // Human-readable labels for risk assessment questions
  // Keys match backend format: q1_fiscalYearEnd, q2_incorporated, etc.
  const questionLabels = {
    q1_fiscalYearEnd: 'Fiscal Year',
    q2_incorporated: 'Incorporated',
    q3_profitLastYear: 'Profitable',
    q4_lastSixMonthPerformance: '6-Mo Trend',
    q5_cleanFinancialYears: 'Clean Books',
    q6_hasGeneralManager: 'Has GM',
    q7_projectBased: 'Recurring Rev',
    q8_largestCustomerPercent: 'Cust. Conc.',
    q9_ownerHours: 'Owner Hours',
    q10_leaseYearsRemaining: 'Lease Years',
    q11_businessAge: 'Business Age',
    q12_operatingSystem: 'Op. System',
    q13_customerPaymentTerms: 'Payment Terms',
    q14_numberOfSPOFs: 'SPOFs',
    q15_neededSalePrice: 'Sale Price'
  };

  // Get readable label for a question key
  const getQuestionLabel = (key) => {
    if (questionLabels[key]) return questionLabels[key];
    // Fallback: convert camelCase to readable format
    return key
      .replace(/^q\d+_/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Check if we have valid currency value
  const hasValidValue = (value) => {
    return value !== undefined && value !== null && !isNaN(value) && value !== 0;
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

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#38a169'; // Green
      case 'B': return '#48bb78'; // Light Green
      case 'C': return '#d69e2e'; // Yellow
      case 'D': return '#ed8936'; // Orange
      case 'F': return '#e53e3e'; // Red
      default: return '#718096';
    }
  };

  const getProbabilityLabel = (probability) => {
    switch (probability) {
      case 'Very High': return { text: 'Very High', color: '#38a169' };
      case 'High': return { text: 'High', color: '#48bb78' };
      case 'Medium': return { text: 'Medium', color: '#d69e2e' };
      case 'Low': return { text: 'Low', color: '#ed8936' };
      case 'Very Low': return { text: 'Very Low', color: '#e53e3e' };
      default: return { text: 'Unknown', color: '#718096' };
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
        {/* Current Enterprise Value - Always show */}
        <div className="metric-card primary">
          <div className="metric-label">Current Enterprise Value</div>
          <div className="metric-value">
            {formatCurrency(results.currentValue) || 'Calculating...'}
          </div>
          <div className="metric-detail">
            {hasValidValue(results.adjustedEbitda) && hasValidValue(results.multipleUsed) ? (
              <>EBITDA: {formatCurrency(results.adjustedEbitda)} × {results.multipleUsed?.toFixed(2)}</>
            ) : (
              'Based on your inputs'
            )}
          </div>
        </div>

        {/* Sellability Score */}
        <div className="metric-card">
          <div className="metric-label">Sellability Score</div>
          <div className="metric-value" style={{ color: getRiskColor(results.riskScore?.category) }}>
            {results.riskScore?.totalScore ?? 0} / {results.riskScore?.maxPossibleScore || 105}
          </div>
          <div className="metric-detail">
            {formatPercent(results.riskScore?.scorePercentage) || '0%'} - {getRiskLabel(results.riskScore?.category)}
          </div>
        </div>

        {/* Grade */}
        <div className="metric-card">
          <div className="metric-label">Grade</div>
          <div className="metric-value grade-display" style={{ color: getGradeColor(results.riskScore?.grade) }}>
            {results.riskScore?.grade || '-'}
          </div>
          <div className="metric-detail" style={{ color: getProbabilityLabel(results.riskScore?.probabilityOfSale).color }}>
            {results.riskScore?.probabilityOfSale ? `${results.riskScore.probabilityOfSale} Probability` : 'Probability TBD'}
          </div>
        </div>

        {/* EBITDA Margin */}
        <div className="metric-card">
          <div className="metric-label">EBITDA Margin</div>
          <div className="metric-value">
            {formatPercent(results.adjustedEbitdaMargin) || formatPercent(results.ebitdaMargin) || (results.ebitdaMethod === 'baseline' ? '11.5%' : '-')}
          </div>
          <div className="metric-detail">
            Method: {results.ebitdaMethod === 'baseline' ? 'Baseline' : 'Actual'}
          </div>
        </div>

        {/* Potential Accelerated Value - Only show if we have valid uplift data */}
        {hasValidValue(results.uplift?.newTotalValue) && (
          <div className="metric-card accent">
            <div className="metric-label">Potential Accelerated Value</div>
            <div className="metric-value">{formatCurrency(results.uplift?.newTotalValue)}</div>
            <div className="metric-detail">
              +{formatCurrency(results.uplift?.totalIncrease)} potential uplift
            </div>
          </div>
        )}
      </div>

      {/* Risk Score Breakdown */}
      <div className="vac-section">
        <h3>Sellability Assessment Breakdown</h3>
        <div className="risk-breakdown">
          <div className="risk-gauge">
            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${(results.riskScore?.scorePercentage || 0) * 100}%`,
                  background: getRiskColor(results.riskScore?.category)
                }}
              />
            </div>
            <div className="gauge-labels">
              <span>Low Sellability (0%)</span>
              <span>High Sellability (100%)</span>
            </div>
          </div>

          {/* Grade Badge */}
          <div className="grade-badge-container">
            <div className="grade-badge" style={{ backgroundColor: getGradeColor(results.riskScore?.grade) }}>
              <span className="grade-letter">{results.riskScore?.grade || '-'}</span>
              <span className="grade-label">{results.riskScore?.probabilityOfSale || 'Unknown'} Probability</span>
            </div>
          </div>

          {results.riskScore?.breakdown && Object.keys(results.riskScore.breakdown).length > 0 && (
            <div className="risk-scores-grid">
              {Object.entries(results.riskScore.breakdown).map(([key, value]) => (
                <div key={key} className="risk-item">
                  <span className="risk-question">{getQuestionLabel(key)}</span>
                  <span className="risk-score">{value ?? '-'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Value Acceleration Levers - Only show if we have valid uplift data */}
      {results.uplift && hasValidValue(results.uplift.newTotalValue) && (
        <div className="vac-section">
          <h3>Value Acceleration Levers</h3>
          <div className="levers-grid">
            {hasValidValue(results.uplift.size?.value) && (
              <div className="lever-card">
                <div className="lever-icon">📈</div>
                <div className="lever-name">Size Lever</div>
                <div className="lever-description">Revenue Growth Impact</div>
                <div className="lever-value">+{formatCurrency(results.uplift.size?.value)}</div>
                <div className="lever-detail">
                  {formatPercent(results.uplift.size?.percent)} increase
                </div>
              </div>
            )}

            {hasValidValue(results.uplift.efficiency?.value) && (
              <div className="lever-card">
                <div className="lever-icon">⚡</div>
                <div className="lever-name">Efficiency Lever</div>
                <div className="lever-description">EBITDA Improvement</div>
                <div className="lever-value">+{formatCurrency(results.uplift.efficiency?.value)}</div>
                <div className="lever-detail">
                  {formatPercent(results.uplift.efficiency?.percent)} increase
                </div>
              </div>
            )}

            {hasValidValue(results.uplift.multiple?.value) && (
              <div className="lever-card">
                <div className="lever-icon">🎯</div>
                <div className="lever-name">Multiple Lever</div>
                <div className="lever-description">Multiple Enhancement</div>
                <div className="lever-value">+{formatCurrency(results.uplift.multiple?.value)}</div>
                <div className="lever-detail">
                  {formatPercent(results.uplift.multiple?.percent)} increase
                </div>
              </div>
            )}
          </div>

          {hasValidValue(results.currentValue) && (
            <div className="combined-impact">
              <div className="impact-label">Combined Acceleration Impact</div>
              <div className="impact-value">
                {formatCurrency(results.currentValue)} → {formatCurrency(results.uplift.newTotalValue)}
              </div>
              <div className="impact-percent">
                +{formatPercent(results.uplift.totalIncrease / results.currentValue)} increase
              </div>
            </div>
          )}
        </div>
      )}

      {/* Probability Distribution - Only show if we have bands with data */}
      {results.probabilityDistribution?.bands?.length > 0 && (
        <div className="vac-section">
          <h3>Valuation Probability Distribution</h3>
          <div className="probability-chart">
            {results.probabilityDistribution.bands.map((band, index) => (
              <div key={index} className="prob-bar-container">
                <div className="prob-label">{band.label}</div>
                <div className="prob-bar-wrapper">
                  <div
                    className="prob-bar"
                    style={{ width: `${(band.probability || 0) * 100}%` }}
                  />
                </div>
                <div className="prob-value">{formatCurrency(band.value) || '-'}</div>
                <div className="prob-percent">{((band.probability || 0) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          {hasValidValue(results.probabilityDistribution.expectedValue) && (
            <div className="expected-value">
              <span>Expected Value:</span>
              <strong>{formatCurrency(results.probabilityDistribution.expectedValue)}</strong>
            </div>
          )}
        </div>
      )}

      {/* Wealth Gap Analysis - Only show if we have current value */}
      {results.wealthGap && hasValidValue(results.wealthGap.currentValue) && (
        <div className="vac-section">
          <h3>Wealth Gap Analysis</h3>
          <div className="wealth-gap-summary">
            <div className="wealth-metric">
              <div className="wealth-label">Current Value</div>
              <div className="wealth-value">{formatCurrency(results.wealthGap.currentValue)}</div>
            </div>

            {hasValidValue(results.wealthGap.targetValue) && (
              <>
                <div className="wealth-arrow">→</div>
                <div className="wealth-metric">
                  <div className="wealth-label">Target Wealth</div>
                  <div className="wealth-value">{formatCurrency(results.wealthGap.targetValue)}</div>
                </div>
                {hasValidValue(results.wealthGap.gap) && (
                  <div className="wealth-metric highlight">
                    <div className="wealth-label">Gap</div>
                    <div className="wealth-value">{formatCurrency(results.wealthGap.gap)}</div>
                  </div>
                )}
                {results.wealthGap.yearsToExit && results.wealthGap.yearsToExit !== Infinity && (
                  <div className="wealth-metric">
                    <div className="wealth-label">Years to Target</div>
                    <div className="wealth-value">{results.wealthGap.yearsToExit?.toFixed(1)} years</div>
                  </div>
                )}
              </>
            )}
          </div>

          {results.wealthGap.yearlyTable && results.wealthGap.yearlyTable.length > 0 && (
            <div className="projection-table">
              <h4>Value Projection</h4>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Projected Value</th>
                    <th>EBITDA</th>
                  </tr>
                </thead>
                <tbody>
                  {results.wealthGap.yearlyTable.map((row, index) => (
                    <tr key={index}>
                      <td>Year {row.year}</td>
                      <td>{formatCurrency(row.value) || '-'}</td>
                      <td>{formatCurrency(row.ebitda) || '-'}</td>
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
          {/* Current Position - always show */}
          <li>
            <strong>Current Position:</strong> Your business is valued at{' '}
            {formatCurrency(results.currentValue) || 'calculation in progress'} based on{' '}
            {results.ebitdaMethod === 'baseline' ? 'estimated baseline' : 'actual'} EBITDA
            {hasValidValue(results.adjustedEbitda) ? ` of ${formatCurrency(results.adjustedEbitda)}` : ''}.
          </li>

          {/* Sellability - show if we have grade */}
          {results.riskScore?.grade && (
            <li>
              <strong>Sellability:</strong> Your business received a{' '}
              <strong style={{ color: getGradeColor(results.riskScore?.grade) }}>
                Grade {results.riskScore?.grade}
              </strong>{' '}
              with a score of {results.riskScore?.totalScore ?? 0}/{results.riskScore?.maxPossibleScore || 105}{' '}
              ({formatPercent(results.riskScore?.scorePercentage) || '0%'}),
              indicating a <strong>{results.riskScore?.probabilityOfSale || 'pending'}</strong> probability of sale.
            </li>
          )}

          {/* Growth Potential - show if we have valid uplift */}
          {hasValidValue(results.uplift?.totalIncrease) && results.uplift.totalIncrease > 0 && (
            <li>
              <strong>Growth Potential:</strong> By implementing the value acceleration levers, you could potentially
              increase your business value by {formatCurrency(results.uplift.totalIncrease)}
              {hasValidValue(results.currentValue) &&
                ` (${formatPercent(results.uplift.totalIncrease / results.currentValue)})`}.
            </li>
          )}

          {/* Timeline - show if we have years to exit */}
          {results.wealthGap?.yearsToExit && results.wealthGap.yearsToExit !== Infinity && hasValidValue(results.wealthGap.targetValue) && (
            <li>
              <strong>Timeline:</strong> At the current growth rate, you could reach your target wealth
              of {formatCurrency(results.wealthGap.targetValue)} in approximately {results.wealthGap.yearsToExit.toFixed(1)} years.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default VACResults;
