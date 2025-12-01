import React from 'react';
import '../styles/DealAnalysis.css';

const DealScorecard = ({ analysis }) => {
  if (!analysis) return null;

  const { dealScorecard, riskAssessment } = analysis;

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'strong_buy': return '#10b981';
      case 'buy': return '#3b82f6';
      case 'hold': return '#f59e0b';
      case 'pass': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'strong_buy': return '🚀';
      case 'buy': return '✅';
      case 'hold': return '⏸️';
      case 'pass': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="deal-scorecard-container">
      <h3 className="deal-section-title">🎯 Deal Scorecard</h3>

      {/* Main Recommendation */}
      <div className="deal-recommendation-box">
        <div
          className="deal-recommendation-badge"
          style={{ backgroundColor: getRecommendationColor(dealScorecard.recommendation) }}
        >
          <span className="recommendation-icon">{getRecommendationIcon(dealScorecard.recommendation)}</span>
          <div className="recommendation-text">
            <div className="recommendation-level">{dealScorecard.recommendationLevel}</div>
            <div className="recommendation-score">Overall Score: {dealScorecard.overallScore.toFixed(2)}/10</div>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="deal-scores-grid">
        <div className="score-item">
          <div className="score-label">Pricing</div>
          <div className="score-bar-container">
            <div className="score-bar-background">
              <div
                className="score-bar-fill"
                style={{
                  width: `${(dealScorecard.pricingScore / 10) * 100}%`,
                  backgroundColor: dealScorecard.pricingScore >= 7 ? '#10b981' : dealScorecard.pricingScore >= 5 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
          <div className="score-value">{dealScorecard.pricingScore.toFixed(1)}</div>
        </div>

        <div className="score-item">
          <div className="score-label">ROI Potential</div>
          <div className="score-bar-container">
            <div className="score-bar-background">
              <div
                className="score-bar-fill"
                style={{
                  width: `${(dealScorecard.roiScore / 10) * 100}%`,
                  backgroundColor: dealScorecard.roiScore >= 7 ? '#10b981' : dealScorecard.roiScore >= 5 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
          <div className="score-value">{dealScorecard.roiScore.toFixed(1)}</div>
        </div>

        <div className="score-item">
          <div className="score-label">Synergies</div>
          <div className="score-bar-container">
            <div className="score-bar-background">
              <div
                className="score-bar-fill"
                style={{
                  width: `${(dealScorecard.synergyScore / 10) * 100}%`,
                  backgroundColor: dealScorecard.synergyScore >= 7 ? '#10b981' : dealScorecard.synergyScore >= 5 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
          <div className="score-value">{dealScorecard.synergyScore.toFixed(1)}</div>
        </div>

        <div className="score-item">
          <div className="score-label">Risk Profile</div>
          <div className="score-bar-container">
            <div className="score-bar-background">
              <div
                className="score-bar-fill"
                style={{
                  width: `${(dealScorecard.riskScore / 10) * 100}%`,
                  backgroundColor: dealScorecard.riskScore >= 7 ? '#10b981' : dealScorecard.riskScore >= 5 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
          <div className="score-value">{dealScorecard.riskScore.toFixed(1)}</div>
        </div>
      </div>

      {/* Rationale */}
      <div className="deal-rationale">
        <h5>Rationale</h5>
        <p>{dealScorecard.rationale}</p>
      </div>

      {/* Risk Grade */}
      <div className="deal-risk-grade-box">
        <div className="risk-grade-label">Overall Risk Grade</div>
        <div className="risk-grade-display">
          <div
            className="risk-grade-badge"
            style={{
              backgroundColor: riskAssessment.riskGrade === 'A' ? '#10b981' :
                              riskAssessment.riskGrade === 'B' ? '#3b82f6' :
                              riskAssessment.riskGrade === 'C' ? '#f59e0b' :
                              riskAssessment.riskGrade === 'D' ? '#f97316' : '#ef4444'
            }}
          >
            {riskAssessment.riskGrade}
          </div>
          <div className="risk-grade-text">{riskAssessment.assessment}</div>
        </div>
      </div>

      {/* Decision Summary */}
      <div className="deal-decision-summary">
        <h5>Decision Framework</h5>
        <div className="decision-items">
          <div className={`decision-item ${dealScorecard.pricingScore >= 6 ? 'positive' : 'negative'}`}>
            <span className="decision-icon">{dealScorecard.pricingScore >= 6 ? '✓' : '✗'}</span>
            <span>Pricing is {dealScorecard.pricingScore >= 6 ? 'attractive' : 'expensive'}</span>
          </div>
          <div className={`decision-item ${dealScorecard.roiScore >= 6 ? 'positive' : 'negative'}`}>
            <span className="decision-icon">{dealScorecard.roiScore >= 6 ? '✓' : '✗'}</span>
            <span>ROI is {dealScorecard.roiScore >= 6 ? 'compelling' : 'modest'}</span>
          </div>
          <div className={`decision-item ${dealScorecard.synergyScore >= 5 ? 'positive' : 'negative'}`}>
            <span className="decision-icon">{dealScorecard.synergyScore >= 5 ? '✓' : '✗'}</span>
            <span>Synergies are {dealScorecard.synergyScore >= 5 ? 'meaningful' : 'limited'}</span>
          </div>
          <div className={`decision-item ${riskAssessment.riskGrade <= 'B' ? 'positive' : 'negative'}`}>
            <span className="decision-icon">{riskAssessment.riskGrade <= 'B' ? '✓' : '✗'}</span>
            <span>Risks are {riskAssessment.riskGrade <= 'B' ? 'manageable' : 'significant'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealScorecard;
