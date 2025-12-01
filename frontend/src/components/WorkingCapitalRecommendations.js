import React, { useState, useEffect } from 'react';
import '../styles/WorkingCapital.css';

const WorkingCapitalRecommendations = ({ analysis, valuationId, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedRecommendations, setCompletedRecommendations] = useState(new Set());

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      // Prepare input data from analysis
      const inputData = {
        accountsReceivable: 0,
        inventory: 0,
        accountsPayable: 0,
        costOfGoodsSold: 0,
        annualRevenue: 0,
        totalCurrentAssets: 0,
        totalCurrentLiabilities: 0,
        industry: analysis.industry
      };

      const response = await fetch(
        `${API_URL}/valuations/${valuationId}/working-capital/recommendations`,
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
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecommendation = (key) => {
    const newCompleted = new Set(completedRecommendations);
    if (newCompleted.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }
    setCompletedRecommendations(newCompleted);
  };

  const categories = {
    collections: '💰 Collections',
    inventory: '📦 Inventory',
    payables: '🤝 Payables',
    overall: '🎯 Overall Strategy',
    strength: '⭐ Strengths'
  };

  const priorityLevels = {
    high: { label: 'High Priority', color: '#ef4444' },
    medium: { label: 'Medium Priority', color: '#f59e0b' },
    low: { label: 'Low Priority', color: '#3b82f6' },
    info: { label: 'Strength', color: '#10b981' }
  };

  let displayedRecommendations = recommendations;
  if (selectedCategory !== 'all') {
    displayedRecommendations = recommendations.filter(r => r.category === selectedCategory);
  }

  const filterOptions = [
    { value: 'all', label: 'All Recommendations' },
    ...Object.entries(categories).map(([key, label]) => ({
      value: key,
      label
    }))
  ];

  const formatCurrency = (value) => {
    if (value === 0 || !value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Math.abs(value));
  };

  return (
    <div className="working-capital-recommendations">
      <div className="wc-recommendations-header">
        <h3>Working Capital Recommendations</h3>
        <p className="wc-subtitle">
          Prioritized actions to optimize your working capital
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="wc-filter-tabs">
        {filterOptions.map(option => (
          <button
            key={option.value}
            className={`wc-filter-tab ${selectedCategory === option.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="wc-recommendations-list">
        {displayedRecommendations.length === 0 ? (
          <div className="wc-empty-state">
            <p>No recommendations in this category</p>
          </div>
        ) : (
          displayedRecommendations.map((rec, index) => (
            <div
              key={rec.key || index}
              className={`wc-recommendation-card ${completedRecommendations.has(rec.key) ? 'completed' : ''}`}
              style={{
                borderLeftColor: priorityLevels[rec.priority].color
              }}
            >
              {/* Checkbox for completion */}
              <div className="rec-checkbox-container">
                <input
                  type="checkbox"
                  id={`rec-${rec.key}`}
                  checked={completedRecommendations.has(rec.key)}
                  onChange={() => handleToggleRecommendation(rec.key)}
                  className="rec-checkbox"
                />
                <label htmlFor={`rec-${rec.key}`} className="rec-checkbox-label" />
              </div>

              {/* Content */}
              <div className="rec-content">
                <div className="rec-header">
                  <h4 className="rec-title">{rec.title}</h4>
                  <span
                    className="rec-priority-badge"
                    style={{ backgroundColor: priorityLevels[rec.priority].color }}
                  >
                    {priorityLevels[rec.priority].label}
                  </span>
                </div>

                <p className="rec-description">{rec.description}</p>

                {/* Details */}
                <div className="rec-details">
                  {rec.impact !== 0 && (
                    <div className="rec-detail-item">
                      <span className="detail-label">💵 Financial Impact:</span>
                      <span className="detail-value">{formatCurrency(rec.impact)}</span>
                    </div>
                  )}

                  <div className="rec-detail-item">
                    <span className="detail-label">⏱️ Timeline:</span>
                    <span className="detail-value">{rec.timeline}</span>
                  </div>

                  <div className="rec-detail-item">
                    <span className="detail-label">💪 Effort:</span>
                    <span className="detail-value">
                      {rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Implementation Steps (if available) */}
                {rec.steps && (
                  <div className="rec-steps">
                    <h5>Implementation Steps:</h5>
                    <ol>
                      {rec.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Status Icon */}
              {completedRecommendations.has(rec.key) && (
                <div className="rec-completed-icon">✓</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      <div className="wc-recommendations-summary">
        <div className="summary-stat">
          <div className="stat-value">{displayedRecommendations.length}</div>
          <div className="stat-label">Total Recommendations</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{completedRecommendations.size}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">
            {displayedRecommendations.filter(r => r.priority === 'high').length}
          </div>
          <div className="stat-label">High Priority</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="wc-recommendations-actions">
        <button className="wc-btn wc-btn-primary" onClick={onClose}>
          Save Progress
        </button>
        <button className="wc-btn wc-btn-secondary" onClick={onClose}>
          Back to Analysis
        </button>
      </div>
    </div>
  );
};

export default WorkingCapitalRecommendations;
