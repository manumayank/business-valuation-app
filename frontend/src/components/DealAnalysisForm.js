import React, { useState } from 'react';
import '../styles/DealAnalysis.css';

const DealAnalysisForm = ({ valuationId, onAnalysisComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    targetCompanyName: '',
    offeredPrice: '',
    targetRevenue: '',
    targetEBITDA: '',
    targetProfit: '',
    targetDebt: '',
    integrationComplexity: '5',
    culturalFitRating: '7',
    integrationTimelineMonths: '12',
    revenueCrossSelling: '',
    revenueMarketExpansion: '',
    costOperationalEfficiency: '',
    costOverheadReduction: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const TOTAL_STEPS = 4;

  const steps = [
    {
      title: 'Deal Terms',
      description: 'Enter the basic deal information',
      fields: ['targetCompanyName', 'offeredPrice', 'integrationTimelineMonths']
    },
    {
      title: 'Target Financials',
      description: 'Enter target company financial metrics',
      fields: ['targetRevenue', 'targetEBITDA', 'targetProfit', 'targetDebt']
    },
    {
      title: 'Integration Assessment',
      description: 'Assess integration complexity and cultural fit',
      fields: ['integrationComplexity', 'culturalFitRating']
    },
    {
      title: 'Synergies',
      description: 'Estimate potential synergies',
      fields: ['revenueCrossSelling', 'revenueMarketExpansion', 'costOperationalEfficiency', 'costOverheadReduction']
    }
  ];

  const fieldLabels = {
    targetCompanyName: 'Target Company Name',
    offeredPrice: 'Offered Purchase Price ($)',
    targetRevenue: 'Target Annual Revenue ($)',
    targetEBITDA: 'Target EBITDA ($)',
    targetProfit: 'Target Net Profit ($)',
    targetDebt: 'Target Debt ($)',
    integrationComplexity: 'Integration Complexity (1-10)',
    culturalFitRating: 'Cultural Fit Rating (1-10)',
    integrationTimelineMonths: 'Integration Timeline (months)',
    revenueCrossSelling: 'Cross-Selling Potential ($)',
    revenueMarketExpansion: 'Market Expansion ($)',
    costOperationalEfficiency: 'Operational Efficiency ($)',
    costOverheadReduction: 'Overhead Reduction ($)'
  };

  const fieldHints = {
    targetCompanyName: 'Name of the company being acquired',
    offeredPrice: 'The purchase price being offered',
    targetRevenue: 'Annual revenue from target company',
    targetEBITDA: 'EBITDA of target company',
    targetProfit: 'Net profit/earnings of target company',
    targetDebt: 'Current debt on target company balance sheet',
    integrationComplexity: 'How complex will integration be? (1=easy, 10=very complex)',
    culturalFitRating: 'How well do cultures align? (1=poor fit, 10=excellent fit)',
    integrationTimelineMonths: 'Expected integration timeline',
    revenueCrossSelling: 'Revenue from cross-selling to existing customers',
    revenueMarketExpansion: 'Revenue from entering new markets',
    costOperationalEfficiency: 'Cost savings from operational improvements',
    costOverheadReduction: 'Cost savings from overhead reduction'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [name]: null
    }));
    setError(null);
  };

  const validateStep = () => {
    const currentFields = steps[currentStep - 1].fields;
    const newErrors = {};
    let isValid = true;

    for (const field of currentFields) {
      const value = formData[field];
      if (!value || value === '') {
        newErrors[field] = 'This field is required';
        isValid = false;
      } else if (field.endsWith('Complexity') || field.endsWith('Rating')) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 10) {
          newErrors[field] = 'Must be between 1 and 10';
          isValid = false;
        }
      } else if (field.startsWith('revenue') || field.startsWith('cost') || field.startsWith('target') || field === 'offeredPrice') {
        if (field === 'targetDebt' && !value) {
          // targetDebt is optional
          continue;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          newErrors[field] = 'Must be a non-negative number';
          isValid = false;
        }
      }
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const payload = {
        offeredPrice: parseFloat(formData.offeredPrice),
        targetRevenue: parseFloat(formData.targetRevenue),
        targetEBITDA: parseFloat(formData.targetEBITDA),
        targetProfit: parseFloat(formData.targetProfit),
        targetDebt: formData.targetDebt ? parseFloat(formData.targetDebt) : 0,
        integrationComplexity: parseInt(formData.integrationComplexity),
        culturalFitRating: parseInt(formData.culturalFitRating),
        integrationTimelineMonths: parseInt(formData.integrationTimelineMonths),
        industry: 'services', // Could be determined from parent valuation
        revenueSynergies: {
          crossSelling: formData.revenueCrossSelling ? parseFloat(formData.revenueCrossSelling) : 0,
          marketExpansion: formData.revenueMarketExpansion ? parseFloat(formData.revenueMarketExpansion) : 0,
          productExpansion: 0,
          other: 0,
          total: (formData.revenueCrossSelling ? parseFloat(formData.revenueCrossSelling) : 0) +
                 (formData.revenueMarketExpansion ? parseFloat(formData.revenueMarketExpansion) : 0)
        },
        costSynergies: {
          operationalEfficiency: formData.costOperationalEfficiency ? parseFloat(formData.costOperationalEfficiency) : 0,
          overheadReduction: formData.costOverheadReduction ? parseFloat(formData.costOverheadReduction) : 0,
          rnd: 0,
          other: 0,
          total: (formData.costOperationalEfficiency ? parseFloat(formData.costOperationalEfficiency) : 0) +
                 (formData.costOverheadReduction ? parseFloat(formData.costOverheadReduction) : 0)
        }
      };

      const response = await fetch(
        `${API_URL}/valuations/${valuationId}/deal/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze deal');
      }

      const analysis = await response.json();
      onAnalysisComplete(analysis, formData.targetCompanyName);

    } catch (err) {
      console.error('Error analyzing deal:', err);
      setError(err.message || 'Failed to analyze deal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep - 1];
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="deal-form-container">
      {/* Header */}
      <div className="deal-form-header">
        <h2>Deal Analysis</h2>
        <p className="deal-form-subtitle">
          Evaluate M&A opportunity and understand deal value
        </p>
      </div>

      {/* Progress Bar */}
      <div className="deal-progress-container">
        <div className="deal-progress-bar">
          <div
            className="deal-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="deal-progress-text">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="deal-error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="deal-step-content">
        <h3 className="deal-step-title">{currentStepData.title}</h3>
        <p className="deal-step-description">{currentStepData.description}</p>

        <div className="deal-form-fields">
          {currentStepData.fields.map(fieldName => (
            <div key={fieldName} className="deal-form-group">
              <label htmlFor={fieldName} className="deal-form-label">
                {fieldLabels[fieldName]}
              </label>
              {fieldName.endsWith('Complexity') || fieldName.endsWith('Rating') ? (
                <input
                  type="number"
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleInputChange}
                  placeholder="Enter value (1-10)"
                  className={`deal-form-input ${validationErrors[fieldName] ? 'error' : ''}`}
                  disabled={isLoading}
                  min="1"
                  max="10"
                />
              ) : (
                <input
                  type={fieldName === 'targetCompanyName' ? 'text' : 'number'}
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                  className={`deal-form-input ${validationErrors[fieldName] ? 'error' : ''}`}
                  disabled={isLoading}
                  min={fieldName === 'targetCompanyName' ? undefined : '0'}
                  step={fieldName === 'targetCompanyName' ? undefined : '0.01'}
                />
              )}
              {fieldHints[fieldName] && (
                <p className="deal-form-hint">{fieldHints[fieldName]}</p>
              )}
              {validationErrors[fieldName] && (
                <p className="deal-form-error">{validationErrors[fieldName]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="deal-form-navigation">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="deal-btn deal-btn-secondary"
            disabled={isLoading}
          >
            ← Previous
          </button>
        )}

        {currentStep < TOTAL_STEPS ? (
          <button
            onClick={handleNext}
            className="deal-btn deal-btn-primary"
            disabled={isLoading}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="deal-btn deal-btn-primary deal-btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing Deal...' : 'Analyze Deal'}
          </button>
        )}

        <button
          onClick={onCancel}
          className="deal-btn deal-btn-cancel"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DealAnalysisForm;
