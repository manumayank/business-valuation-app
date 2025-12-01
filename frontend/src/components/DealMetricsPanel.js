import React from 'react';
import '../styles/DealAnalysis.css';

const DealMetricsPanel = ({ analysis, onViewScorecard, onViewSynergies, onViewRiskAssessment, onViewNegotiationGuidance, onViewScenarios }) => {
  if (!analysis) {
    return <div className="deal-empty-state">No deal analysis available</div>;
  }

  const { dealMetrics, multipleAnalysis, roiAnalysis } = analysis;

  const getMetricColor = (assessment) => {
    switch (assessment) {
      case 'overpriced':
      case 'high':
      case 'poor':
        return '#ef4444';
      case 'fair':
      case 'moderate':
      case 'acceptable':
        return '#f59e0b';
      case 'underpriced':
      case 'reasonable':
      case 'good':
      case 'excellent':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="deal-metrics-panel">
      {/* Price Assessment */}
      <div className="deal-metrics-section">
        <h3 className="deal-section-title">💰 Pricing Assessment</h3>

        <div className="deal-price-comparison">
          <div className="price-card">
            <div className="price-label">Offered Price</div>
            <div className="price-value">{formatCurrency(dealMetrics.offeredPrice)}</div>
          </div>
          <div className="price-card">
            <div className="price-label">Fair Value</div>
            <div className="price-value">{formatCurrency(dealMetrics.fairValue)}</div>
          </div>
          <div className="price-card">
            <div className="price-label" style={{ color: getMetricColor(dealMetrics.assessment) }}>
              Premium / (Discount)
            </div>
            <div className="price-value" style={{ color: getMetricColor(dealMetrics.assessment) }}>
              {dealMetrics.premium.percentage > 0 ? '+' : ''}{dealMetrics.premium.percentage}%
            </div>
          </div>
        </div>

        <div className="deal-fair-range">
          <p>Fair Value Range: {formatCurrency(dealMetrics.fairValueRange.low)} - {formatCurrency(dealMetrics.fairValueRange.high)}</p>
          <p className={`assessment-badge ${dealMetrics.assessment}`}>
            {dealMetrics.assessment.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Multiple Analysis */}
      <div className="deal-metrics-section">
        <h3 className="deal-section-title">📊 Multiple Analysis</h3>

        <div className="deal-multiples-grid">
          {/* EV/EBITDA */}
          <div className="multiple-card">
            <div className="multiple-metric">EV/EBITDA</div>
            <div className="multiple-values">
              <div className="multiple-offered">
                <span className="multiple-label">Offered</span>
                <span className="multiple-number">{multipleAnalysis.ev_ebitda.offered}x</span>
              </div>
              <div className="multiple-industry">
                <span className="multiple-label">Industry Avg</span>
                <span className="multiple-number">{multipleAnalysis.ev_ebitda.industry}x</span>
              </div>
            </div>
            <div className="multiple-assessment" style={{ color: getMetricColor(multipleAnalysis.ev_ebitda.assessment) }}>
              {multipleAnalysis.ev_ebitda.assessment.toUpperCase()}
            </div>
          </div>

          {/* P/E */}
          <div className="multiple-card">
            <div className="multiple-metric">P/E Multiple</div>
            <div className="multiple-values">
              <div className="multiple-offered">
                <span className="multiple-label">Offered</span>
                <span className="multiple-number">{multipleAnalysis.price_earnings.offered}x</span>
              </div>
              <div className="multiple-industry">
                <span className="multiple-label">Industry Avg</span>
                <span className="multiple-number">{multipleAnalysis.price_earnings.industry}x</span>
              </div>
            </div>
            <div className="multiple-assessment" style={{ color: getMetricColor(multipleAnalysis.price_earnings.assessment) }}>
              {multipleAnalysis.price_earnings.assessment.toUpperCase()}
            </div>
          </div>

          {/* Price to Sales */}
          <div className="multiple-card">
            <div className="multiple-metric">Price/Sales</div>
            <div className="multiple-values">
              <div className="multiple-offered">
                <span className="multiple-label">Offered</span>
                <span className="multiple-number">{multipleAnalysis.price_sales.offered}x</span>
              </div>
              <div className="multiple-industry">
                <span className="multiple-label">Industry Avg</span>
                <span className="multiple-number">{multipleAnalysis.price_sales.industry}x</span>
              </div>
            </div>
            <div className="multiple-assessment" style={{ color: getMetricColor(multipleAnalysis.price_sales.assessment) }}>
              {multipleAnalysis.price_sales.assessment.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="deal-metrics-section">
        <h3 className="deal-section-title">📈 Return on Investment</h3>

        <div className="deal-roi-grid">
          <div className="roi-card">
            <div className="roi-metric">Expected ROI</div>
            <div className="roi-value" style={{ color: getMetricColor(roiAnalysis.roiAssessment) }}>
              {roiAnalysis.expectedROIPercent}%
            </div>
            <div className="roi-assessment">
              {roiAnalysis.roiAssessment.charAt(0).toUpperCase() + roiAnalysis.roiAssessment.slice(1)}
            </div>
          </div>

          <div className="roi-card">
            <div className="roi-metric">Payback Period</div>
            <div className="roi-value">{roiAnalysis.paybackPeriod} years</div>
            <div className="roi-note">
              {roiAnalysis.paybackPeriod <= 3 ? 'Quick payback' : roiAnalysis.paybackPeriod <= 5 ? 'Reasonable' : 'Extended period'}
            </div>
          </div>

          <div className="roi-card">
            <div className="roi-metric">NPV (5-year)</div>
            <div className="roi-value" style={{ color: roiAnalysis.npv > 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(roiAnalysis.npv)}
            </div>
            <div className="roi-note">
              {roiAnalysis.npv > 0 ? 'Value creating' : 'Value destructing'}
            </div>
          </div>

          <div className="roi-card">
            <div className="roi-metric">IRR</div>
            <div className="roi-value">{roiAnalysis.irrPercent}%</div>
            <div className="roi-note">Internal rate of return</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="deal-metrics-summary">
        <h4>Key Takeaways</h4>
        <ul>
          <li>
            {dealMetrics.assessment === 'fair'
              ? 'Deal is reasonably priced within fair value range'
              : dealMetrics.assessment === 'underpriced'
              ? 'Deal is priced below fair value - attractive opportunity'
              : 'Deal is priced above fair value - consider negotiation'}
          </li>
          <li>
            {roiAnalysis.roiAssessment === 'excellent'
              ? 'Strong expected returns justify acquisition'
              : roiAnalysis.roiAssessment === 'good'
              ? 'Solid expected returns with acceptable risk'
              : 'Returns may not justify acquisition risk'}
          </li>
          <li>
            Payback period of {roiAnalysis.paybackPeriod} years
            {roiAnalysis.paybackPeriod <= 3 ? ' - quick value realization' : roiAnalysis.paybackPeriod <= 5 ? ' - reasonable timeline' : ' - extended investment period'}
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="deal-analysis-nav-buttons">
        <h4>Detailed Analysis</h4>
        <div className="nav-button-grid">
          {onViewScorecard && (
            <button className="deal-nav-btn" onClick={onViewScorecard}>
              📋 Deal Scorecard
            </button>
          )}
          {onViewSynergies && (
            <button className="deal-nav-btn" onClick={onViewSynergies}>
              💼 Synergy Analysis
            </button>
          )}
          {onViewRiskAssessment && (
            <button className="deal-nav-btn" onClick={onViewRiskAssessment}>
              ⚠️ Risk Assessment
            </button>
          )}
          {onViewNegotiationGuidance && (
            <button className="deal-nav-btn" onClick={onViewNegotiationGuidance}>
              💬 Negotiation Guidance
            </button>
          )}
          {onViewScenarios && (
            <button className="deal-nav-btn" onClick={onViewScenarios}>
              📊 Scenarios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealMetricsPanel;
