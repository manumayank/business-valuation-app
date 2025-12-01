import React from 'react';
import './RiskAnalysis.css';

const RiskAnalysis = ({ riskAnalysis }) => {
  if (!riskAnalysis) return null;

  const { overallScore, grade, categories } = riskAnalysis;

  // Determine grade color and status
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return '#10b981'; // green
      case 'B':
        return '#3b82f6'; // blue
      case 'C':
        return '#f59e0b'; // amber
      case 'D':
        return '#f97316'; // orange
      case 'F':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  // Determine grade label
  const getGradeLabel = (grade) => {
    switch (grade) {
      case 'A':
        return 'Excellent';
      case 'B':
        return 'Good';
      case 'C':
        return 'Moderate';
      case 'D':
        return 'High';
      case 'F':
        return 'Very High';
      default:
        return 'Unknown';
    }
  };

  const categoryLabels = {
    financial: 'Financial Risk',
    operational: 'Operational Risk',
    market: 'Market Risk',
    management: 'Management Risk',
    compliance: 'Compliance Risk'
  };

  const categoryDescriptions = {
    financial: 'Profitability, debt levels, and cash generation',
    operational: 'Team size, customer concentration, and scale',
    market: 'Growth rate and market position',
    management: 'Experience and team depth',
    compliance: 'Regulatory and legal factors'
  };

  return (
    <section className="dashboard-section risk-analysis-section">
      <h3 className="section-title">Risk Assessment</h3>

      {/* Overall Risk Score Card */}
      <div className="risk-score-card">
        <div className="risk-score-display">
          <div
            className="risk-score-circle"
            style={{ borderColor: getGradeColor(grade) }}
          >
            <div className="score-value">{overallScore}</div>
            <div className="score-label">Risk Score</div>
          </div>
          <div className="risk-grade-display">
            <div
              className="grade-letter"
              style={{ backgroundColor: getGradeColor(grade) }}
            >
              {grade}
            </div>
            <div className="grade-label">{getGradeLabel(grade)} Risk</div>
            <p className="grade-description">
              {grade === 'A' && 'Your business has low risk factors. Strong fundamentals.'}
              {grade === 'B' && 'Your business has good fundamentals with some areas to watch.'}
              {grade === 'C' && 'Your business has moderate risk. Consider addressing key areas.'}
              {grade === 'D' && 'Your business has elevated risk. Focus on improvements recommended.'}
              {grade === 'F' && 'Your business has high risk. Urgent improvements needed.'}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Categories Breakdown */}
      <div className="risk-categories">
        <h4>Risk Breakdown by Category</h4>
        <div className="categories-grid">
          {categories && Object.entries(categories).map(([key, value]) => (
            <div key={key} className="category-card">
              <h5>{categoryLabels[key]}</h5>
              <div className="category-score">
                <div className="score-number">{value}</div>
                <div className="score-max">/ 100</div>
              </div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${(value / 100) * 100}%`,
                    backgroundColor: value <= 20 ? '#10b981' : value <= 40 ? '#3b82f6' : value <= 60 ? '#f59e0b' : value <= 80 ? '#f97316' : '#ef4444'
                  }}
                ></div>
              </div>
              <p className="category-description">{categoryDescriptions[key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Interpretation Guide */}
      <div className="risk-guide">
        <h4>How to Interpret Your Risk Score</h4>
        <div className="guide-items">
          <div className="guide-item">
            <span className="guide-range" style={{ backgroundColor: '#10b981' }}>0-20</span>
            <p><strong>Low Risk (A)</strong> - Excellent fundamentals, stable business model</p>
          </div>
          <div className="guide-item">
            <span className="guide-range" style={{ backgroundColor: '#3b82f6' }}>20-40</span>
            <p><strong>Good (B)</strong> - Strong business with minor improvement areas</p>
          </div>
          <div className="guide-item">
            <span className="guide-range" style={{ backgroundColor: '#f59e0b' }}>40-60</span>
            <p><strong>Moderate (C)</strong> - Average risk, several areas need attention</p>
          </div>
          <div className="guide-item">
            <span className="guide-range" style={{ backgroundColor: '#f97316' }}>60-80</span>
            <p><strong>High (D)</strong> - Elevated risk, focus on critical improvements</p>
          </div>
          <div className="guide-item">
            <span className="guide-range" style={{ backgroundColor: '#ef4444' }}>80-100</span>
            <p><strong>Very High (F)</strong> - Significant challenges, urgent action needed</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskAnalysis;
