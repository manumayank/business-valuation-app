import React, { useState } from 'react';
import '../styles/WorkingCapital.css';

const WorkingCapitalForm = ({ valuationId, industry, onAnalysisComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    accountsReceivable: '',
    inventory: '',
    accountsPayable: '',
    costOfGoodsSold: '',
    annualRevenue: '',
    totalCurrentAssets: '',
    totalCurrentLiabilities: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const TOTAL_STEPS = 3;

  const steps = [
    {
      title: 'Receivables & Inventory',
      description: 'Enter your accounts receivable and inventory values',
      fields: ['accountsReceivable', 'inventory']
    },
    {
      title: 'Payables & COGS',
      description: 'Enter your accounts payable and cost of goods sold',
      fields: ['accountsPayable', 'costOfGoodsSold']
    },
    {
      title: 'Working Capital Summary',
      description: 'Enter your total current assets and liabilities',
      fields: ['totalCurrentAssets', 'totalCurrentLiabilities', 'annualRevenue']
    }
  ];

  const fieldLabels = {
    accountsReceivable: 'Accounts Receivable ($)',
    inventory: 'Inventory ($)',
    accountsPayable: 'Accounts Payable ($)',
    costOfGoodsSold: 'Annual Cost of Goods Sold ($)',
    annualRevenue: 'Annual Revenue ($)',
    totalCurrentAssets: 'Total Current Assets ($)',
    totalCurrentLiabilities: 'Total Current Liabilities ($)'
  };

  const fieldHints = {
    accountsReceivable: 'Money owed to you by customers',
    inventory: 'Value of goods in stock',
    accountsPayable: 'Money you owe to suppliers',
    costOfGoodsSold: 'Cost of goods sold in the past year',
    annualRevenue: 'Total revenue in the past year',
    totalCurrentAssets: 'Current assets due within 12 months',
    totalCurrentLiabilities: 'Current liabilities due within 12 months'
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
      } else {
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
        accountsReceivable: parseFloat(formData.accountsReceivable),
        inventory: parseFloat(formData.inventory),
        accountsPayable: parseFloat(formData.accountsPayable),
        costOfGoodsSold: parseFloat(formData.costOfGoodsSold),
        annualRevenue: parseFloat(formData.annualRevenue),
        totalCurrentAssets: parseFloat(formData.totalCurrentAssets),
        totalCurrentLiabilities: parseFloat(formData.totalCurrentLiabilities),
        industry: industry
      };

      const response = await fetch(
        `${API_URL}/valuations/${valuationId}/working-capital/calculate`,
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
        throw new Error(errorData.error || 'Failed to calculate working capital');
      }

      const analysis = await response.json();
      onAnalysisComplete(analysis);

    } catch (err) {
      console.error('Error calculating working capital:', err);
      setError(err.message || 'Failed to calculate working capital. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep - 1];
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="working-capital-form-container">
      {/* Header */}
      <div className="wc-form-header">
        <h2>Working Capital Analysis</h2>
        <p className="wc-form-subtitle">
          Optimize your working capital to improve cash flow and valuation
        </p>
      </div>

      {/* Progress Bar */}
      <div className="wc-progress-container">
        <div className="wc-progress-bar">
          <div
            className="wc-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="wc-progress-text">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="wc-error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="wc-step-content">
        <h3 className="wc-step-title">{currentStepData.title}</h3>
        <p className="wc-step-description">{currentStepData.description}</p>

        <div className="wc-form-fields">
          {currentStepData.fields.map(fieldName => (
            <div key={fieldName} className="wc-form-group">
              <label htmlFor={fieldName} className="wc-form-label">
                {fieldLabels[fieldName]}
              </label>
              <input
                type="number"
                id={fieldName}
                name={fieldName}
                value={formData[fieldName]}
                onChange={handleInputChange}
                placeholder="Enter amount"
                className={`wc-form-input ${validationErrors[fieldName] ? 'error' : ''}`}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
              {fieldHints[fieldName] && (
                <p className="wc-form-hint">{fieldHints[fieldName]}</p>
              )}
              {validationErrors[fieldName] && (
                <p className="wc-form-error">{validationErrors[fieldName]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="wc-form-navigation">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="wc-btn wc-btn-secondary"
            disabled={isLoading}
          >
            ← Previous
          </button>
        )}

        {currentStep < TOTAL_STEPS ? (
          <button
            onClick={handleNext}
            className="wc-btn wc-btn-primary"
            disabled={isLoading}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="wc-btn wc-btn-primary wc-btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Working Capital'}
          </button>
        )}

        <button
          onClick={onCancel}
          className="wc-btn wc-btn-cancel"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WorkingCapitalForm;
