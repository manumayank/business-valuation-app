import React from 'react';
import '../styles/WorkingCapital.css';

const WorkingCapitalAnalysis = ({ analysis, onOptimize, onViewRecommendations }) => {
  if (!analysis || !analysis.metrics) {
    return (
      <div className="wc-empty-state">
        <p>No working capital analysis available</p>
      </div>
    );
  }

  const { metrics, riskAssessment, optimizationImpact, valuationImpact } = analysis;

  // Helper function to get metric status
  const getMetricStatus = (gap, type = 'standard') => {
    if (type === 'payables') {
      // For DPO, positive gap is better (we want to be above benchmark)
      if (gap > 5) return { status: 'good', label: 'Above Average', color: '#10b981' };
      if (gap > -5) return { status: 'fair', label: 'Average', color: '#f59e0b' };
      return { status: 'poor', label: 'Below Average', color: '#ef4444' };
    } else {
      // For DSO, DIO, CCC, negative gap is better (we want to be below benchmark)
      if (gap > 5) return { status: 'poor', label: 'Below Average', color: '#ef4444' };
      if (gap > -5) return { status: 'fair', label: 'Average', color: '#f59e0b' };
      return { status: 'good', label: 'Above Average', color: '#10b981' };
    }
  };

  // Helper function to get risk grade color
  const getRiskColor = (grade) => {
    switch (grade) {
      case 'A': return '#10b981';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const dsoStatus = getMetricStatus(metrics.dso.gap, 'standard');
  const dioStatus = getMetricStatus(metrics.dio.gap, 'standard');
  const dpoStatus = getMetricStatus(metrics.dpo.gap, 'payables');
  const cccStatus = getMetricStatus(metrics.ccc.gap, 'standard');

  return (
    <div className="working-capital-analysis">
      {/* Summary Cards */}
      <div className="wc-summary-section">
        <h3 className="section-title">Working Capital Metrics</h3>

        {/* Metrics Grid */}
        <div className="wc-metrics-grid">
          {/* DSO Card */}
          <div className="wc-metric-card">
            <div className="wc-metric-header">
              <h4>Days Sales Outstanding</h4>
              <span className="wc-metric-code">DSO</span>
            </div>
            <div className="wc-metric-value">{metrics.dso.value}d</div>
            <div className="wc-metric-benchmark">
              Industry Average: {metrics.dso.benchmark}d
            </div>
            <div className="wc-metric-gap">
              Gap: <span style={{ color: dsoStatus.color }}>
                {metrics.dso.gap > 0 ? '+' : ''}{metrics.dso.gap}d
              </span>
            </div>
            <div className="wc-metric-status" style={{ color: dsoStatus.color }}>
              {dsoStatus.label}
            </div>
            <p className="wc-metric-description">Time to collect from customers</p>
          </div>

          {/* DIO Card */}
          <div className="wc-metric-card">
            <div className="wc-metric-header">
              <h4>Days Inventory Outstanding</h4>
              <span className="wc-metric-code">DIO</span>
            </div>
            <div className="wc-metric-value">{metrics.dio.value}d</div>
            <div className="wc-metric-benchmark">
              Industry Average: {metrics.dio.benchmark}d
            </div>
            <div className="wc-metric-gap">
              Gap: <span style={{ color: dioStatus.color }}>
                {metrics.dio.gap > 0 ? '+' : ''}{metrics.dio.gap}d
              </span>
            </div>
            <div className="wc-metric-status" style={{ color: dioStatus.color }}>
              {dioStatus.label}
            </div>
            <p className="wc-metric-description">Days inventory in stock</p>
          </div>

          {/* DPO Card */}
          <div className="wc-metric-card">
            <div className="wc-metric-header">
              <h4>Days Payable Outstanding</h4>
              <span className="wc-metric-code">DPO</span>
            </div>
            <div className="wc-metric-value">{metrics.dpo.value}d</div>
            <div className="wc-metric-benchmark">
              Industry Average: {metrics.dpo.benchmark}d
            </div>
            <div className="wc-metric-gap">
              Gap: <span style={{ color: dpoStatus.color }}>
                {metrics.dpo.gap > 0 ? '+' : ''}{metrics.dpo.gap}d
              </span>
            </div>
            <div className="wc-metric-status" style={{ color: dpoStatus.color }}>
              {dpoStatus.label}
            </div>
            <p className="wc-metric-description">Time to pay suppliers</p>
          </div>

          {/* CCC Card */}
          <div className="wc-metric-card wc-ccc-card">
            <div className="wc-metric-header">
              <h4>Cash Conversion Cycle</h4>
              <span className="wc-metric-code">CCC</span>
            </div>
            <div className="wc-metric-value">{metrics.ccc.value}d</div>
            <div className="wc-metric-benchmark">
              Industry Average: {metrics.ccc.benchmark}d
            </div>
            <div className="wc-metric-gap">
              Gap: <span style={{ color: cccStatus.color }}>
                {metrics.ccc.gap > 0 ? '+' : ''}{metrics.ccc.gap}d
              </span>
            </div>
            <div className="wc-metric-status" style={{ color: cccStatus.color }}>
              {cccStatus.label}
            </div>
            <p className="wc-metric-description">Time from paying suppliers to collecting</p>
            {metrics.ccc.value < 0 && (
              <div className="wc-metric-positive-indicator">
                ✓ Negative CCC is excellent!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Working Capital Percentage */}
      <div className="wc-percentage-section">
        <h4>Working Capital as % of Revenue</h4>
        <div className="wc-percentage-display">
          <div className="wc-percentage-value">
            {(metrics.wcPercentage.value * 100).toFixed(2)}%
          </div>
          <div className="wc-percentage-benchmark">
            vs. {(metrics.wcPercentage.benchmark * 100).toFixed(2)}% industry average
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="wc-risk-section">
        <h3 className="section-title">Working Capital Risk Assessment</h3>
        <div className="wc-risk-card">
          <div className="wc-risk-score-display">
            <div
              className="wc-risk-circle"
              style={{ borderColor: getRiskColor(riskAssessment.grade) }}
            >
              <div className="wc-risk-value">{riskAssessment.score}</div>
              <div className="wc-risk-label">Risk Score</div>
            </div>
            <div className="wc-risk-details">
              <div
                className="wc-risk-grade"
                style={{ backgroundColor: getRiskColor(riskAssessment.grade) }}
              >
                {riskAssessment.grade}
              </div>
              <p className="wc-risk-assessment">{riskAssessment.assessment}</p>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="wc-risk-factors">
            <h5>Risk Factors</h5>
            <div className="wc-factors-grid">
              {riskAssessment.factors && Object.entries(riskAssessment.factors).map(([key, factor]) => (
                <div key={key} className="wc-factor-item">
                  <div className="wc-factor-label">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="wc-factor-score">{factor.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Impact */}
      <div className="wc-valuation-impact-section">
        <h3 className="section-title">Impact on Business Valuation</h3>
        <div className="wc-impact-card">
          <div className="wc-impact-content">
            <div className="wc-impact-message">
              {valuationImpact.totalCashReleased > 0 ? (
                <>
                  <h4>🎯 Optimization Opportunity</h4>
                  <p>{valuationImpact.description}</p>
                  <div className="wc-impact-highlight">
                    <div className="impact-value">
                      ${valuationImpact.estimatedValuationLift.toLocaleString()}
                    </div>
                    <div className="impact-label">Potential Valuation Increase</div>
                  </div>
                </>
              ) : (
                <>
                  <h4>✓ Well Optimized</h4>
                  <p>{valuationImpact.description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="wc-analysis-actions">
        <button className="wc-btn wc-btn-primary" onClick={onOptimize}>
          View Optimization Scenarios
        </button>
        <button className="wc-btn wc-btn-secondary" onClick={onViewRecommendations}>
          View Recommendations
        </button>
      </div>
    </div>
  );
};

export default WorkingCapitalAnalysis;
