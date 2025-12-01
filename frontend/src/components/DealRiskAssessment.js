import React from 'react';
import '../styles/DealAnalysis.css';

const DealRiskAssessment = ({ analysis }) => {
  if (!analysis || !analysis.riskAssessment) return null;

  const { riskAssessment } = analysis;

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

  return (
    <div className="risk-assessment-container">
      <h3 className="deal-section-title">⚠️ Risk Assessment</h3>

      {/* Overall Risk Score */}
      <div className="risk-score-display">
        <div
          className="risk-score-circle"
          style={{ borderColor: getRiskColor(riskAssessment.riskGrade) }}
        >
          <div className="risk-score-value">{riskAssessment.overallRiskScore}</div>
          <div className="risk-score-label">Risk Score</div>
        </div>

        <div className="risk-grade-info">
          <div
            className="risk-grade-letter"
            style={{ backgroundColor: getRiskColor(riskAssessment.riskGrade) }}
          >
            {riskAssessment.riskGrade}
          </div>
          <p className="risk-assessment-text">{riskAssessment.assessment}</p>
        </div>
      </div>

      {/* Risk Factors Grid */}
      <div className="risk-factors-grid">
        <div className="risk-factor-item">
          <div className="risk-factor-name">Integration Complexity</div>
          <div className="risk-factor-score">{riskAssessment.integrationComplexity}/10</div>
          <div className="risk-factor-bar">
            <div
              className="risk-factor-bar-fill"
              style={{
                width: `${(riskAssessment.integrationComplexity / 10) * 100}%`,
                backgroundColor: riskAssessment.integrationComplexity > 7 ? '#ef4444' : riskAssessment.integrationComplexity > 5 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>

        <div className="risk-factor-item">
          <div className="risk-factor-name">Cultural Fit</div>
          <div className="risk-factor-score">{riskAssessment.culturalFitRating}/10</div>
          <div className="risk-factor-bar">
            <div
              className="risk-factor-bar-fill"
              style={{
                width: `${(riskAssessment.culturalFitRating / 10) * 100}%`,
                backgroundColor: riskAssessment.culturalFitRating > 7 ? '#10b981' : riskAssessment.culturalFitRating > 5 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
        </div>

        {riskAssessment.factors.customerRetention && (
          <div className="risk-factor-item">
            <div className="risk-factor-name">Customer Retention Risk</div>
            <div className="risk-factor-score">{riskAssessment.factors.customerRetention.score}</div>
            <div className="risk-factor-bar">
              <div
                className="risk-factor-bar-fill"
                style={{
                  width: `${(riskAssessment.factors.customerRetention.score / 100) * 100}%`,
                  backgroundColor: riskAssessment.factors.customerRetention.score < 50 ? '#ef4444' : riskAssessment.factors.customerRetention.score < 70 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        )}

        {riskAssessment.factors.regulatory && (
          <div className="risk-factor-item">
            <div className="risk-factor-name">Regulatory Risk</div>
            <div className="risk-factor-score">{riskAssessment.factors.regulatory.score}</div>
            <div className="risk-factor-bar">
              <div
                className="risk-factor-bar-fill"
                style={{
                  width: `${(riskAssessment.factors.regulatory.score / 100) * 100}%`,
                  backgroundColor: riskAssessment.factors.regulatory.score < 50 ? '#ef4444' : riskAssessment.factors.regulatory.score < 70 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Risk Mitigation Recommendations */}
      <div className="risk-mitigation-section">
        <h4>Mitigation Strategies</h4>
        <ul className="mitigation-list">
          {riskAssessment.integrationComplexity > 7 && (
            <li>
              <strong>High Integration Complexity:</strong> Establish dedicated integration office with executive sponsor
            </li>
          )}
          {riskAssessment.culturalFitRating < 5 && (
            <li>
              <strong>Cultural Mismatch:</strong> Implement cultural alignment program and retain key talent with retention bonuses
            </li>
          )}
          {riskAssessment.factors.customerRetention && riskAssessment.factors.customerRetention.score < 50 && (
            <li>
              <strong>Customer Retention Risk:</strong> Develop customer communication plan and consider earnout provisions tied to customer retention
            </li>
          )}
          {riskAssessment.factors.regulatory && riskAssessment.factors.regulatory.score < 50 && (
            <li>
              <strong>Regulatory Risk:</strong> Engage regulatory counsel early and structure deal to address compliance requirements
            </li>
          )}
          <li>Establish contingency reserves (typically 10-15% of deal value)</li>
          <li>Structure deal with earnout provisions tied to synergy realization</li>
          <li>Create detailed integration plan with clear accountability</li>
        </ul>
      </div>

      {/* Risk Grade Legend */}
      <div className="risk-grade-legend">
        <h5>Risk Grade Definition</h5>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}>A</div>
            <span>Minimal Risk - Strong fit and low concerns</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}>B</div>
            <span>Low Risk - Manageable concerns with good planning</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}>C</div>
            <span>Moderate Risk - Requires careful management and contingency plans</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f97316' }}>D</div>
            <span>High Risk - Significant concerns requiring expert mitigation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }}>F</div>
            <span>Very High Risk - Major red flags, reconsider deal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealRiskAssessment;
