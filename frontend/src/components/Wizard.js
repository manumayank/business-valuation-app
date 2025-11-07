import React, { useState } from 'react';
import './Wizard.css';
import { submitValuation } from '../services/api';

const Wizard = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'tech',
    annualRevenue: '',
    ebitda: '',
    yearsInBusiness: '',
    employees: '',
    growthRate: '',
    profitMargin: '',
    customerRetention: '',
    topCustomerConcentration: '',
    debtLevel: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
        break;
      case 2:
        if (!formData.annualRevenue) newErrors.annualRevenue = 'Annual revenue is required';
        else if (isNaN(formData.annualRevenue) || parseFloat(formData.annualRevenue) <= 0)
          newErrors.annualRevenue = 'Annual revenue must be a positive number';

        if (!formData.ebitda) newErrors.ebitda = 'EBITDA is required';
        else if (isNaN(formData.ebitda) || parseFloat(formData.ebitda) <= 0)
          newErrors.ebitda = 'EBITDA must be a positive number';

        if (parseFloat(formData.ebitda) > parseFloat(formData.annualRevenue)) {
          newErrors.ebitda = 'EBITDA cannot exceed annual revenue';
        }
        break;
      case 3:
        if (!formData.yearsInBusiness) newErrors.yearsInBusiness = 'Years in business is required';
        else if (isNaN(formData.yearsInBusiness) || parseInt(formData.yearsInBusiness) < 0)
          newErrors.yearsInBusiness = 'Years in business must be a non-negative number';

        if (!formData.employees) newErrors.employees = 'Number of employees is required';
        else if (isNaN(formData.employees) || parseInt(formData.employees) <= 0)
          newErrors.employees = 'Number of employees must be a positive number';
        break;
      case 4:
        if (!formData.growthRate && formData.growthRate !== '0') newErrors.growthRate = 'Growth rate is required';
        else if (isNaN(formData.growthRate) || parseFloat(formData.growthRate) < 0 || parseFloat(formData.growthRate) > 100)
          newErrors.growthRate = 'Growth rate must be between 0 and 100';

        if (!formData.profitMargin && formData.profitMargin !== '0') newErrors.profitMargin = 'Profit margin is required';
        else if (isNaN(formData.profitMargin) || parseFloat(formData.profitMargin) < 0 || parseFloat(formData.profitMargin) > 100)
          newErrors.profitMargin = 'Profit margin must be between 0 and 100';

        if (!formData.customerRetention && formData.customerRetention !== '0') newErrors.customerRetention = 'Customer retention is required';
        else if (isNaN(formData.customerRetention) || parseFloat(formData.customerRetention) < 0 || parseFloat(formData.customerRetention) > 100)
          newErrors.customerRetention = 'Customer retention must be between 0 and 100';
        break;
      case 5:
        if (!formData.topCustomerConcentration && formData.topCustomerConcentration !== '0')
          newErrors.topCustomerConcentration = 'Top customer concentration is required';
        else if (isNaN(formData.topCustomerConcentration) || parseFloat(formData.topCustomerConcentration) < 0 || parseFloat(formData.topCustomerConcentration) > 100)
          newErrors.topCustomerConcentration = 'Top customer concentration must be between 0 and 100';

        if (!formData.debtLevel && formData.debtLevel !== '0') newErrors.debtLevel = 'Debt level is required';
        else if (isNaN(formData.debtLevel) || parseFloat(formData.debtLevel) < 0 || parseFloat(formData.debtLevel) > 100)
          newErrors.debtLevel = 'Debt level must be between 0 and 100';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const result = await submitValuation(userId, formData);
      setLoading(false);
      onComplete(result, result.valuationId || generateValuationId());
    } catch (error) {
      setLoading(false);
      setSubmitError(error.response?.data?.error || 'Failed to calculate valuation. Please try again.');
    }
  };

  const generateValuationId = () => {
    return 'val_' + Date.now();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step">
            <h2>Company Information</h2>
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter your company name"
                className={errors.companyName ? 'error' : ''}
              />
              {errors.companyName && <span className="error-message">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className={errors.industry ? 'error' : ''}
              >
                <option value="tech">Technology</option>
                <option value="retail">Retail</option>
                <option value="services">Services</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="default">Other</option>
              </select>
              {errors.industry && <span className="error-message">{errors.industry}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step">
            <h2>Financial Metrics</h2>
            <div className="form-group">
              <label htmlFor="annualRevenue">
                Annual Revenue ($)
                <span className="help-text">Gross revenue for the last 12 months</span>
              </label>
              <input
                type="number"
                id="annualRevenue"
                name="annualRevenue"
                value={formData.annualRevenue}
                onChange={handleInputChange}
                placeholder="1000000"
                className={errors.annualRevenue ? 'error' : ''}
              />
              {errors.annualRevenue && <span className="error-message">{errors.annualRevenue}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="ebitda">
                EBITDA ($)
                <span className="help-text">Earnings Before Interest, Taxes, Depreciation, Amortization</span>
              </label>
              <input
                type="number"
                id="ebitda"
                name="ebitda"
                value={formData.ebitda}
                onChange={handleInputChange}
                placeholder="250000"
                className={errors.ebitda ? 'error' : ''}
              />
              {errors.ebitda && <span className="error-message">{errors.ebitda}</span>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step">
            <h2>Company Operations</h2>
            <div className="form-group">
              <label htmlFor="yearsInBusiness">Years in Business</label>
              <input
                type="number"
                id="yearsInBusiness"
                name="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={handleInputChange}
                placeholder="5"
                className={errors.yearsInBusiness ? 'error' : ''}
              />
              {errors.yearsInBusiness && <span className="error-message">{errors.yearsInBusiness}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="employees">Number of Employees</label>
              <input
                type="number"
                id="employees"
                name="employees"
                value={formData.employees}
                onChange={handleInputChange}
                placeholder="50"
                className={errors.employees ? 'error' : ''}
              />
              {errors.employees && <span className="error-message">{errors.employees}</span>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step">
            <h2>Growth & Performance</h2>
            <div className="form-group">
              <label htmlFor="growthRate">
                Annual Growth Rate (%)
                <span className="help-text">Expected year-over-year revenue growth</span>
              </label>
              <input
                type="number"
                id="growthRate"
                name="growthRate"
                value={formData.growthRate}
                onChange={handleInputChange}
                placeholder="15"
                min="0"
                max="100"
                step="0.1"
                className={errors.growthRate ? 'error' : ''}
              />
              {errors.growthRate && <span className="error-message">{errors.growthRate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="profitMargin">
                Profit Margin (%)
                <span className="help-text">Net profit as a percentage of revenue</span>
              </label>
              <input
                type="number"
                id="profitMargin"
                name="profitMargin"
                value={formData.profitMargin}
                onChange={handleInputChange}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
                className={errors.profitMargin ? 'error' : ''}
              />
              {errors.profitMargin && <span className="error-message">{errors.profitMargin}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerRetention">
                Customer Retention Rate (%)
                <span className="help-text">Percentage of customers retained year-over-year</span>
              </label>
              <input
                type="number"
                id="customerRetention"
                name="customerRetention"
                value={formData.customerRetention}
                onChange={handleInputChange}
                placeholder="85"
                min="0"
                max="100"
                step="0.1"
                className={errors.customerRetention ? 'error' : ''}
              />
              {errors.customerRetention && <span className="error-message">{errors.customerRetention}</span>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step">
            <h2>Risk Factors</h2>
            <div className="form-group">
              <label htmlFor="topCustomerConcentration">
                Top Customer Concentration (%)
                <span className="help-text">Percentage of revenue from your largest customer</span>
              </label>
              <input
                type="number"
                id="topCustomerConcentration"
                name="topCustomerConcentration"
                value={formData.topCustomerConcentration}
                onChange={handleInputChange}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
                className={errors.topCustomerConcentration ? 'error' : ''}
              />
              {errors.topCustomerConcentration && <span className="error-message">{errors.topCustomerConcentration}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="debtLevel">
                Debt Level (% of Revenue)
                <span className="help-text">Total debt as a percentage of annual revenue</span>
              </label>
              <input
                type="number"
                id="debtLevel"
                name="debtLevel"
                value={formData.debtLevel}
                onChange={handleInputChange}
                placeholder="40"
                min="0"
                max="100"
                step="0.1"
                className={errors.debtLevel ? 'error' : ''}
              />
              {errors.debtLevel && <span className="error-message">{errors.debtLevel}</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard">
      <div className="wizard-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <p className="progress-text">Step {currentStep} of {totalSteps}</p>
      </div>

      {submitError && (
        <div className="error-banner">
          <p>{submitError}</p>
        </div>
      )}

      <div className="wizard-content">
        {renderStep()}
      </div>

      <div className="wizard-actions">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Back
        </button>

        {currentStep < totalSteps ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            Next
          </button>
        ) : (
          <button
            className="btn btn-primary btn-success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Valuation'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Wizard;
