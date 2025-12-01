import React from 'react';
import '../styles/DealAnalysis.css';

const NegotiationGuidance = ({ analysis }) => {
  if (!analysis || !analysis.negotiationGuidance) return null;

  const { negotiationGuidance, dealMetrics } = analysis;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPriceMargin = negotiationGuidance.walkAwayPrice - negotiationGuidance.suggestedBid;
  const marginPercent = ((getPriceMargin / negotiationGuidance.suggestedBid) * 100).toFixed(1);

  return (
    <div className="negotiation-guidance-container">
      <h3 className="deal-section-title">💬 Negotiation Guidance</h3>

      {/* Pricing Strategy */}
      <div className="negotiation-section">
        <h4>Pricing Strategy</h4>

        <div className="price-range-visual">
          <div className="price-range-item">
            <div className="price-range-label">Walk-Away Price</div>
            <div className="price-range-value" style={{ color: '#ef4444' }}>
              {formatCurrency(negotiationGuidance.walkAwayPrice)}
            </div>
            <div className="price-range-note">Maximum acceptable price</div>
          </div>

          <div className="price-range-item">
            <div className="price-range-label">Target/Suggested Bid</div>
            <div className="price-range-value" style={{ color: '#f59e0b' }}>
              {formatCurrency(negotiationGuidance.suggestedBid)}
            </div>
            <div className="price-range-note">Optimal offer price</div>
          </div>

          <div className="price-range-item">
            <div className="price-range-label">Fair Value Range</div>
            <div className="price-range-value" style={{ color: '#3b82f6' }}>
              {formatCurrency(negotiationGuidance.fairValueRange.low)} - {formatCurrency(negotiationGuidance.fairValueRange.high)}
            </div>
            <div className="price-range-note">Industry-based valuation</div>
          </div>

          <div className="price-range-item">
            <div className="price-range-label">Current Offer</div>
            <div className="price-range-value" style={{ color: '#6b7280' }}>
              {formatCurrency(dealMetrics.offeredPrice)}
            </div>
            <div className="price-range-note">
              {dealMetrics.offeredPrice > negotiationGuidance.walkAwayPrice
                ? '⚠️ Above walk-away price'
                : dealMetrics.offeredPrice < negotiationGuidance.suggestedBid
                ? '✓ Below suggested bid'
                : '✓ In negotiation range'}
            </div>
          </div>
        </div>

        <div className="negotiation-margin-info">
          <p>
            <strong>Negotiation Margin:</strong> ${formatCurrency(getPriceMargin)} ({marginPercent}% of suggested bid)
          </p>
          <p className="margin-note">
            This is your available negotiation range with the seller before reaching your walk-away price.
          </p>
        </div>
      </div>

      {/* Key Leverage Points */}
      <div className="negotiation-section">
        <h4>Key Negotiation Points</h4>
        <div className="leverage-points">
          {negotiationGuidance.keyLeverPoints.map((point, idx) => (
            <div key={idx} className="leverage-point">
              <div className="leverage-icon">💪</div>
              <div className="leverage-text">{point}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Negotiation Tips */}
      <div className="negotiation-section">
        <h4>Negotiation Strategy</h4>
        <ul className="negotiation-tips">
          {negotiationGuidance.negotiationTips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Deal Structure Recommendations */}
      <div className="negotiation-section">
        <h4>Deal Structure Recommendations</h4>
        <ul className="structure-recommendations">
          <li>
            <strong>Earnout Provisions:</strong> Consider 10-20% earnout tied to synergy realization or performance metrics
          </li>
          <li>
            <strong>Seller Financing:</strong> Can bridge valuation gaps while reducing buyer's cash outlay
          </li>
          <li>
            <strong>Staged Closing:</strong> Phase payments based on integration milestones and customer retention
          </li>
          <li>
            <strong>Holdback:</strong> Retain 5-10% for contingencies and working capital adjustments
          </li>
          <li>
            <strong>Employment Agreements:</strong> Ensure key management stays with retention bonuses
          </li>
        </ul>
      </div>

      {/* Timeline Recommendations */}
      <div className="negotiation-section">
        <h4>Deal Timeline</h4>
        <ul className="timeline-recommendations">
          <li><strong>LOI Phase:</strong> 2-4 weeks - Establish basic terms and exclusivity</li>
          <li><strong>Due Diligence:</strong> 4-8 weeks - Comprehensive financial and operational review</li>
          <li><strong>Negotiation:</strong> 2-4 weeks - Final terms and deal documentation</li>
          <li><strong>Closing:</strong> 1-2 weeks - Final close and transition planning</li>
          <li><strong>Total Timeline:</strong> 10-18 weeks typical for mid-market M&A</li>
        </ul>
      </div>
    </div>
  );
};

export default NegotiationGuidance;
